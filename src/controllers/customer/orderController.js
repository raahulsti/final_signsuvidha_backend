const orderModel   = require('../../models/orderModel');
const cartModel    = require('../../models/cartModel');
const addressModel = require('../../models/addressModel');
const db           = require('../../config/db');
const { calculateItemPrice } = require('../../services/pricingService');
const { success, created, notFound, error, paginated } = require('../../utils/response');
const { getPagination, getPaginationMeta, generateOrderNumber } = require('../../utils/helpers');

exports.checkout = async (req, res, next) => {
  try {
    const { shipping_address_id, billing_same_as_shipping = true,
            billing_address_id, shipping_service_id, notes } = req.body;

    // Validate address belongs to user
    const shippingAddr = await addressModel.getById(shipping_address_id, req.user.id);
    if (!shippingAddr) return notFound(res, 'Shipping address not found');

    // Get cart items (must have vendor selected)
    const cartItems = await cartModel.getCartByUser(req.user.id);
    if (!cartItems.length) return error(res, 'Cart is empty', 400);

    // All items must have vendor selected (or null = admin)
    const unselected = cartItems.filter((item) => item.vendor_id === undefined);
    // vendor_id null is OK (means company/admin), just check all went through comparison

    // Get shipping cost
    const shippingService = await db.findOne('SELECT base_price FROM shipping_services WHERE id = ? AND is_active = 1', [shipping_service_id]);
    if (!shippingService) return notFound(res, 'Shipping service not found');

    // Group cart items by vendor
    // For simplicity: all items go to same vendor (first item's vendor)
    // In production: split into multiple orders per vendor
    const vendorId = cartItems[0].vendor_id || null;

    // Calculate totals
    let subtotal = 0;
    const pricedItems = [];

    for (const item of cartItems) {
      const pricing = await calculateItemPrice(item, item.vendor_id);
      subtotal += pricing.total_price;
      pricedItems.push({ ...item, ...pricing });
    }

    const shippingCost = parseFloat(shippingService.base_price);
    const totalAmount  = parseFloat((subtotal + shippingCost).toFixed(2));
    const orderNumber  = generateOrderNumber();

    // Create order + items in a transaction
    const orderId = await db.withTransaction(async (conn) => {
      const oid = await orderModel.create(conn, {
        customer_user_id:         req.user.id,
        vendor_id:                vendorId,
        order_number:             orderNumber,
        shipping_address_id,
        billing_same_as_shipping: billing_same_as_shipping ? 1 : 0,
        billing_address_id:       billing_same_as_shipping ? null : billing_address_id,
        shipping_service_id,
        shipping_cost:            shippingCost,
        subtotal,
        total_amount:             totalAmount,
        notes,
      });

      for (const item of pricedItems) {
        await orderModel.createItem(conn, {
          order_id:           oid,
          product_type_id:    item.product_type_id,
          material_id:        item.material_id,
          element_id:         item.element_id,
          color_id:           item.color_id,
          font_id:            item.font_id,
          letter_style_id:    item.letter_style_id,
          text_layers:        item.text_layers,
          height:             item.height,
          width:              item.width,
          dimension_unit_id:  item.dimension_unit_id,
          uploaded_image_url: item.uploaded_image_url,
          price_per_sqft:     item.price_per_sqft,
          material_cost:      item.material_cost,
          element_cost:       item.element_cost,
          color_extra:        item.color_extra,
          letter_style_extra: item.letter_style_extra,
          unit_price:         item.unit_price,
          quantity:           item.quantity,
          total_price:        item.total_price,
          preview_image_url:  item.preview_image_url,
        });
      }

      // Clear cart after order placed
      await conn.execute('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);

      return oid;
    });

    return created(res, { order_id: orderId, order_number: orderNumber, total_amount: totalAmount },
      'Order placed successfully');
  } catch (err) { next(err); }
};

exports.getOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const { offset, limit: lim } = getPagination(page, limit);
    const { rows, total } = await orderModel.getByCustomer({
      userId: req.user.id, status, offset, limit: lim,
    });
    return paginated(res, rows, getPaginationMeta(total, page, lim));
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const order = await orderModel.getById(req.params.id);
    if (!order || order.customer_user_id !== req.user.id) return notFound(res, 'Order not found');
    const items = await orderModel.getOrderItems(order.id);
    return success(res, { ...order, items });
  } catch (err) { next(err); }
};

exports.initiatePayment = async (req, res, next) => {
  try {
    const order = await orderModel.getById(req.params.id);
    if (!order || order.customer_user_id !== req.user.id) return notFound(res, 'Order not found');
    const { payment_method } = req.body;
    // TODO: Integrate actual payment gateway (Razorpay / PhonePe / Paytm)
    await orderModel.updatePayment(order.id, {
      payment_method,
      payment_status:         'pending',
      payment_transaction_id: null,
    });
    return success(res, { order_id: order.id, payment_method, total: order.total_amount },
      'Payment initiated. Integrate gateway here.');
  } catch (err) { next(err); }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const order = await orderModel.getById(req.params.id);
    if (!order) return notFound(res, 'Order not found');
    // TODO: Verify signature from payment gateway
    const { transaction_id } = req.body;
    await orderModel.updatePayment(order.id, {
      payment_method:         order.payment_method,
      payment_status:         'paid',
      payment_transaction_id: transaction_id,
    });
    await orderModel.updateStatus(order.id, 'confirmed');
    return success(res, {}, 'Payment verified. Order confirmed.');
  } catch (err) { next(err); }
};
