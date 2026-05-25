const orderModel   = require('../../models/orderModel');
const cartModel    = require('../../models/cartModel');
const addressModel = require('../../models/addressModel');
const paymentBatchModel = require('../../models/paymentBatchModel');
const taxConfigModel = require('../../models/taxConfigModel');
const db           = require('../../config/db');
const { calculateItemPrice } = require('../../services/pricingService');
const { createOrder, verifySignature } = require('../../services/razorpayService');
const { success, created, notFound, error, paginated } = require('../../utils/response');
const { getPagination, getPaginationMeta } = require('../../utils/helpers');
const { nextSellerSerials, saveInvoiceNumber } = require('../../services/orderNumberService');
const { enrichOrder, enrichOrders } = require('../../services/orderResponseService');
const { LOLLIPOP_PRODUCT_TYPE_ID, PRODUCT_SLUGS } = require('../../utils/constants');

const isLollipopOrderItem = (item) =>
  String(item.product_type_id) === String(LOLLIPOP_PRODUCT_TYPE_ID)
  || item.product_type_slug === PRODUCT_SLUGS.LOLLIPOP_SIGN;

const isPylonOrderItem = (item) =>
  item.product_type_slug === PRODUCT_SLUGS.PYLON_SIGN
  || !!item.pylon_id;

const isFixedPriceOrderItem = (item) =>
  isLollipopOrderItem(item) || isPylonOrderItem(item) || !!item.listed_product_id;

const getAdminSellerId = async () => {
  const admin = await db.findOne(
    `SELECT u.id
     FROM users u
     INNER JOIN user_roles ur ON ur.user_id = u.id
     INNER JOIN roles r ON r.id = ur.role_id
     WHERE r.name = 'super_admin'
     ORDER BY u.id ASC
     LIMIT 1`
  );
  return admin?.id || null;
};

const initiateBatchPaymentCore = async ({ batch, payment_method }) => {
  if (batch.payment_status === 'paid') {
    return {
      payload: { payment_batch_id: batch.id },
      message: 'Payment already completed',
    };
  }

  if (payment_method === 'cod') {
    const orders = await paymentBatchModel.getOrdersByBatch(batch.id);
    await Promise.all(orders.map((o) => orderModel.updatePayment(o.id, {
      payment_method: 'cod',
      payment_status: 'pending',
      payment_transaction_id: null,
    })));
    return {
      payload: {
        payment_batch_id: batch.id,
        payment_method: 'cod',
        payable_amount: batch.payable_amount,
      },
      message: 'COD selected for this payment batch',
    };
  }

  if (payment_method !== 'razorpay') {
    const err = new Error('Only razorpay and cod are supported currently');
    err.statusCode = 400;
    throw err;
  }

  const amountInPaise = Math.round(Number(batch.payable_amount || 0) * 100);
  if (!amountInPaise || amountInPaise < 100) {
    const err = new Error('Payable amount must be at least ₹1.00');
    err.statusCode = 400;
    throw err;
  }

  const razorOrder = await createOrder({
    amountInPaise,
    receipt: `batch_${batch.id}_${Date.now()}`,
    notes: {
      payment_batch_id: String(batch.id),
      customer_user_id: String(batch.customer_user_id),
    },
  });
  await paymentBatchModel.updateGatewayOrder(batch.id, {
    payment_method: 'razorpay',
    gateway_order_id: razorOrder.id,
  });
  return {
    payload: {
      payment_batch_id: batch.id,
      batch_number: batch.batch_number,
      amount: amountInPaise,
      currency: 'INR',
      razorpay_order_id: razorOrder.id,
      razorpay_key_id: process.env.RAZORPAY_KEY_ID,
      payment_method: 'razorpay',
    },
    message: 'Razorpay batch order created',
  };
};

const verifyBatchPaymentCore = async ({ batch, razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  if (batch.payment_status === 'paid') {
    return {
      payload: {
        payment_batch_id: batch.id,
        payment_status: 'paid',
        payment_id: batch.gateway_payment_id,
      },
      message: 'Payment already verified for this batch.',
    };
  }
  if (batch.payment_method !== 'razorpay') {
    const err = new Error('This batch is not configured for Razorpay');
    err.statusCode = 400;
    throw err;
  }
  if (batch.gateway_order_id !== razorpay_order_id) {
    const err = new Error('Razorpay order mismatch');
    err.statusCode = 400;
    throw err;
  }
  const isValid = verifySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
  if (!isValid) {
    const err = new Error('Invalid Razorpay signature');
    err.statusCode = 400;
    throw err;
  }

  await paymentBatchModel.markPaid(batch.id, {
    payment_method: 'razorpay',
    gateway_order_id: razorpay_order_id,
    gateway_payment_id: razorpay_payment_id,
    gateway_signature: razorpay_signature,
  });

  const orders = await paymentBatchModel.getOrdersByBatch(batch.id);
  const finalized = await db.withTransaction(async (conn) => {
    const done = [];
    for (const order of orders) {
      await orderModel.updatePayment(order.id, {
        payment_method: 'razorpay',
        payment_status: 'paid',
        payment_transaction_id: razorpay_payment_id,
      });
      await orderModel.updateStatus(order.id, 'confirmed');

      const existingInvoice = await db.findOne('SELECT invoice_number FROM order_invoice_numbers WHERE order_id = ?', [order.id]);
      let finalOrderNumber = order.order_number;
      let finalInvoiceNumber = existingInvoice?.invoice_number || null;

      const isPendingOrderNumber = !finalOrderNumber || String(finalOrderNumber).startsWith('PENDING-');
      if (isPendingOrderNumber || !finalInvoiceNumber) {
        const sellerType = order.seller_type || (order.vendor_id ? 'vendor' : 'admin');
        const { orderNumber, invoiceNumber } = await nextSellerSerials(conn, {
          sellerType,
          vendorId: order.vendor_id || null,
        });
        finalOrderNumber = orderNumber;
        finalInvoiceNumber = invoiceNumber;
        await orderModel.updateOrderNumber(order.id, finalOrderNumber);
        await saveInvoiceNumber(conn, order.id, finalInvoiceNumber);
      }

      done.push({
        order_id: order.id,
        order_number: finalOrderNumber,
        invoice_number: finalInvoiceNumber,
      });
    }
    return done;
  });

  return {
    payload: {
      payment_batch_id: batch.id,
      payment_status: 'paid',
      payment_id: razorpay_payment_id,
      paid_order_count: orders.length,
      orders: finalized,
    },
    message: 'Payment verified. All orders confirmed.',
  };
};

exports.checkout = async (req, res, next) => {
  try {
    const { shipping_address_id, billing_same_as_shipping = true,
            billing_address_id, shipping_service_id, notes } = req.body;

    // Validate address belongs to user
    const shippingAddr = await addressModel.getActiveById(shipping_address_id, req.user.id);
    if (!shippingAddr) return notFound(res, 'Shipping address not found');

    if (!billing_same_as_shipping && billing_address_id) {
      const billingAddr = await addressModel.getActiveById(billing_address_id, req.user.id);
      if (!billingAddr) return notFound(res, 'Billing address not found');
    }

    // Get cart items (must have vendor selected)
    const cartItems = await cartModel.getCartByUser(req.user.id);
    if (!cartItems.length) return error(res, 'Cart is empty', 400);

    // All items must have vendor selected (or null = admin)
    const unselected = cartItems.filter((item) => item.vendor_id === undefined);
    // vendor_id null is OK (means company/admin), just check all went through comparison

    // Calculate item pricing first.
    const pricedItems = [];
    for (const item of cartItems) {
      const pricing = await calculateItemPrice(item, item.vendor_id);
      pricedItems.push({ ...item, ...pricing });
    }

    // Group by selected seller (vendor_id NULL means company/admin).
    const grouped = new Map();
    pricedItems.forEach((item) => {
      const key = item.vendor_id == null ? 'admin' : `vendor:${item.vendor_id}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(item);
    });

    // shipping_service_id is optional in API, but DB schema may still require a non-null id.
    // Use provided value, else fallback to the first active shipping service id.
    let effectiveShippingServiceId = shipping_service_id || null;
    if (!effectiveShippingServiceId) {
      const fallbackService = await db.findOne(
        'SELECT id FROM shipping_services WHERE is_active = 1 ORDER BY id ASC LIMIT 1'
      );
      if (!fallbackService) {
        return error(res, 'No active shipping service found. Please create one active shipping service.', 400);
      }
      effectiveShippingServiceId = fallbackService.id;
    }

    const shippingCost = 0;
    const adminSellerId = await getAdminSellerId();
    const groupedEntries = Array.from(grouped.entries()).map(([, items]) => {
      const vendorId = items[0].vendor_id || null;
      const subtotal = parseFloat(items.reduce((sum, x) => sum + Number(x.total_price || 0), 0).toFixed(2));
      const totalAmount = parseFloat((subtotal + shippingCost).toFixed(2));
      const sellerType = vendorId ? 'vendor' : 'admin';
      const sellerId = sellerType === 'admin' ? adminSellerId : vendorId;
      return { items, vendorId, sellerType, sellerId, subtotal, shippingCost, totalAmount };
    });

    const totalOrderAmount = parseFloat(groupedEntries.reduce((s, g) => s + Number(g.totalAmount || 0), 0).toFixed(2));
    const activeTax = await taxConfigModel.getActive();
    const gstPercent = parseFloat(activeTax?.gst_percent || 0);
    const totalGstAmount = parseFloat(((totalOrderAmount * gstPercent) / 100).toFixed(2));
    const payableAmount = parseFloat((totalOrderAmount + totalGstAmount).toFixed(2));

    // Proportionate GST per order; keep rounding balanced on last entry.
    let allocatedGst = 0;
    groupedEntries.forEach((entry, idx) => {
      if (idx === groupedEntries.length - 1) {
        entry.gstAmount = parseFloat((totalGstAmount - allocatedGst).toFixed(2));
      } else {
        const ratio = totalOrderAmount > 0 ? (entry.totalAmount / totalOrderAmount) : 0;
        entry.gstAmount = parseFloat((totalGstAmount * ratio).toFixed(2));
        allocatedGst = parseFloat((allocatedGst + entry.gstAmount).toFixed(2));
      }
      entry.payableAmount = parseFloat((entry.totalAmount + entry.gstAmount).toFixed(2));
    });

    // Create one order per seller group in a single transaction.
    const createdOrders = await db.withTransaction(async (conn) => {
      const results = [];
      for (const entry of groupedEntries) {
        const { items, vendorId, sellerType, sellerId, subtotal, totalAmount, gstAmount, payableAmount: orderPayableAmount } = entry;
        const pendingOrderNumber = `PENDING-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

        const orderId = await orderModel.create(conn, {
          customer_user_id: req.user.id,
          vendor_id: vendorId,
          seller_type: sellerType,
          seller_id: sellerId,
          order_number: pendingOrderNumber,
          shipping_address_id,
          billing_same_as_shipping: billing_same_as_shipping ? 1 : 0,
          billing_address_id: billing_same_as_shipping ? null : billing_address_id,
          shipping_service_id: effectiveShippingServiceId,
          shipping_cost: shippingCost,
          subtotal,
          total_amount: totalAmount,
          gst_percent: gstPercent,
          gst_amount: gstAmount,
          payable_amount: orderPayableAmount,
          notes,
        });

        for (const item of items) {
          await orderModel.createItem(conn, {
            order_id: orderId,
            listed_product_id: item.listed_product_id || null,
            listed_product_size: item.listed_product_size || null,
            product_type_id: item.product_type_id,
            material_id: item.material_id,
            material_style_id: item.material_style_id,
            frame_id: item.frame_id,
            wallpaper_id: item.wallpaper_id,
            add_border_id: item.add_border_id,
            border_is_lit: item.border_is_lit,
            lollipop_element_id: item.lollipop_element_id,
            pylon_id: item.pylon_id || null,
            pylon_category_id: item.pylon_category_id || null,
            pylon_tiles_count: item.pylon_tiles_count ?? 0,
            pylon_tiles_images: item.pylon_tiles_images || [],
            pylon_category_price: item.pylon_category_price,
            pylon_tiles_price: item.pylon_tiles_price,
            pylon_category_cost: item.pylon_category_cost,
            pylon_tiles_cost: item.pylon_tiles_cost,
            add_border_base_price: item.add_border_base_price,
            add_border_lit_extra: item.add_border_lit_extra,
            add_border_cost: item.add_border_cost,
            lollipop_element_cost: item.lollipop_element_cost,
            base_id: item.base_id,
            thickness_id: item.thickness_id,
            element_id: item.element_id,
            color_id: item.color_id,
            font_id: item.font_id,
            illumination_option_id: item.illumination_option_id,
            text_layers: item.text_layers,
            height: isFixedPriceOrderItem(item) ? 0 : (item.height || 0),
            width: isFixedPriceOrderItem(item) ? 0 : (item.width || 0),
            dimension_unit_id: isFixedPriceOrderItem(item) ? null : (item.dimension_unit_id || null),
            uploaded_image_url: item.uploaded_image_url,
            price_per_sqft: item.price_per_sqft,
            material_cost: item.material_cost,
            material_style_price_per_sqft: item.material_style_price_per_sqft,
            material_style_cost: item.material_style_cost,
            frame_price_per_sqft: item.frame_price_per_sqft,
            frame_cost: item.frame_cost,
            wallpaper_price_per_sqft: item.wallpaper_price_per_sqft,
            wallpaper_cost: item.wallpaper_cost,
            base_price_per_sqft: item.base_price_per_sqft,
            base_cost: item.base_cost,
            thickness_price_per_sqft: item.thickness_price_per_sqft,
            thickness_cost: item.thickness_cost,
            element_cost: item.element_cost,
            color_extra: item.color_extra,
            illumination_cost: item.illumination_cost,
            unit_price: item.unit_price,
            quantity: item.quantity,
            total_price: item.total_price,
            preview_image_url: item.preview_image_url,
          });
        }

        results.push({
          order_id: orderId,
          order_number: null,
          invoice_number: null,
          vendor_id: vendorId,
          seller_type: sellerType,
          seller_id: sellerId,
          subtotal,
          shipping_cost: shippingCost,
          total_amount: totalAmount,
          gst_percent: gstPercent,
          gst_amount: gstAmount,
          payable_amount: orderPayableAmount,
        });
      }
      const batchNumber = `PB-${Date.now()}-${req.user.id}`;

      const paymentBatchId = await paymentBatchModel.create(conn, {
        customer_user_id: req.user.id,
        batch_number: batchNumber,
        total_order_amount: totalOrderAmount,
        gst_percent: gstPercent,
        gst_amount: totalGstAmount,
        payable_amount: payableAmount,
      });
      for (const row of results) {
        await paymentBatchModel.attachOrder(conn, paymentBatchId, row.order_id);
        await orderModel.updatePaymentBatchId(conn, row.order_id, paymentBatchId);
      }

      // Clear cart after all orders are created.
      await conn.execute('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
      return { orders: results, paymentBatchId, batchNumber, totalOrderAmount, gstPercent, gstAmount: totalGstAmount, payableAmount };
    });

    const grandTotal = createdOrders.payableAmount;
    const normalizedOrders = createdOrders.orders;
    const responsePayload = {
      orders: normalizedOrders,
      order_count: normalizedOrders.length,
      grand_total: grandTotal,
      payment_batch: {
        id: createdOrders.paymentBatchId,
        batch_number: createdOrders.batchNumber,
        total_order_amount: createdOrders.totalOrderAmount,
        gst_percent: createdOrders.gstPercent,
        gst_amount: createdOrders.gstAmount,
        payable_amount: createdOrders.payableAmount,
      },
    };
    if (normalizedOrders.length === 1) {
      responsePayload.order_id = normalizedOrders[0].order_id;
      responsePayload.order_number = normalizedOrders[0].order_number;
      responsePayload.invoice_number = normalizedOrders[0].invoice_number;
      responsePayload.total_amount = normalizedOrders[0].total_amount;
    }
    return created(res, responsePayload, 'Order placed successfully');
  } catch (err) { next(err); }
};

exports.getOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const { offset, limit: lim } = getPagination(page, limit);
    const adminSellerId = await getAdminSellerId();
    const { rows, total } = await orderModel.getByCustomer({
      userId: req.user.id, status, offset, limit: lim,
    });
    const enriched = await enrichOrders(rows, adminSellerId, { maskNumbers: true, includeCustomer: false });
    return paginated(res, enriched, getPaginationMeta(total, page, lim));
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const order = await orderModel.getById(req.params.id);
    if (!order || order.customer_user_id !== req.user.id) return notFound(res, 'Order not found');
    const adminSellerId = await getAdminSellerId();
    const enriched = await enrichOrder(order, null, adminSellerId);
    return success(res, enriched);
  } catch (err) { next(err); }
};

exports.initiateBatchPayment = async (req, res, next) => {
  try {
    const { payment_batch_id, payment_method } = req.body;
    const batch = await paymentBatchModel.getByIdAndCustomer(payment_batch_id, req.user.id);
    if (!batch) return notFound(res, 'Payment batch not found');
    const { payload, message } = await initiateBatchPaymentCore({ batch, payment_method });
    return success(res, payload, message);
  } catch (err) { next(err); }
};

exports.verifyBatchPayment = async (req, res, next) => {
  try {
    const { payment_batch_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const batch = await paymentBatchModel.getByIdAndCustomer(payment_batch_id, req.user.id);
    if (!batch) return notFound(res, 'Payment batch not found');
    const { payload, message } = await verifyBatchPaymentCore({
      batch,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    return success(res, payload, message);
  } catch (err) { next(err); }
};

exports.failBatchPayment = async (req, res, next) => {
  try {
    const {
      payment_batch_id,
      payment_method = 'razorpay',
      razorpay_order_id,
      razorpay_payment_id,
      reason,
    } = req.body;
    const batch = await paymentBatchModel.getByIdAndCustomer(payment_batch_id, req.user.id);
    if (!batch) return notFound(res, 'Payment batch not found');
    if (batch.payment_status === 'paid') return error(res, 'Payment already completed for this batch', 400);

    await paymentBatchModel.markFailed(batch.id, {
      payment_method,
      gateway_order_id: razorpay_order_id || batch.gateway_order_id || null,
      gateway_payment_id: razorpay_payment_id || null,
      gateway_signature: reason || null,
    });

    const orders = await paymentBatchModel.getOrdersByBatch(batch.id);
    for (const order of orders) {
      await orderModel.updatePayment(order.id, {
        payment_method,
        payment_status: 'failed',
        payment_transaction_id: razorpay_payment_id || null,
      });
    }

    return success(res, {
      payment_batch_id: batch.id,
      payment_status: 'failed',
      failed_order_count: orders.length,
    }, 'Payment marked as failed. You can retry payment for this batch.');
  } catch (err) { next(err); }
};

exports.initiatePayment = async (req, res, next) => {
  try {
    const order = await orderModel.getById(req.params.id);
    if (!order || order.customer_user_id !== req.user.id) return notFound(res, 'Order not found');
    const { payment_method } = req.body;
    const batch = await paymentBatchModel.getByOrderIdAndCustomer(order.id, req.user.id);
    if (!batch) return error(res, 'Payment batch not found for this order', 400);
    const { payload, message } = await initiateBatchPaymentCore({ batch, payment_method });
    return success(res, { ...payload, order_id: order.id }, message);
  } catch (err) { next(err); }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const order = await orderModel.getById(req.params.id);
    if (!order || order.customer_user_id !== req.user.id) return notFound(res, 'Order not found');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const batch = await paymentBatchModel.getByOrderIdAndCustomer(order.id, req.user.id);
    if (!batch) return error(res, 'Payment batch not found for this order', 400);
    const { payload, message } = await verifyBatchPaymentCore({
      batch,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    return success(res, { ...payload, order_id: order.id }, message);
  } catch (err) { next(err); }
};
