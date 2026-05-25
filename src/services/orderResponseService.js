const db = require('../config/db');
const addressModel = require('../models/addressModel');
const paymentBatchModel = require('../models/paymentBatchModel');
const orderModel = require('../models/orderModel');
const { PRODUCT_SLUGS, LOLLIPOP_PRODUCT_TYPE_ID } = require('../utils/constants');

const nullableStr = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

const parseTextLayers = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }
  return [];
};

const parseUrlArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((u) => typeof u === 'string' && u.trim()).map((u) => u.trim());
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((u) => typeof u === 'string' && u.trim()).map((u) => u.trim())
        : [];
    } catch (_) {
      return value.trim() ? [value.trim()] : [];
    }
  }
  return [];
};

const formatAddress = (addr) => {
  if (!addr) return null;
  const parts = [
    addr.address_line1,
    addr.address_line2,
    addr.city,
    addr.state,
    addr.pincode,
    addr.country || 'India',
  ].filter(Boolean);
  return {
    id: addr.id,
    address_title: addr.address_title,
    full_name: addr.full_name,
    phone: addr.phone,
    email: addr.email,
    address_line1: addr.address_line1,
    address_line2: addr.address_line2,
    city: addr.city,
    state: addr.state,
    pincode: addr.pincode,
    country: addr.country || 'India',
    is_default: !!addr.is_default,
    billing_type: addr.billing_type,
    formatted: parts.join(', '),
  };
};

const toNestedListedOrderItem = (item) => ({
  id: item.id,
  order_id: item.order_id,
  item_type: 'listed',
  quantity: item.quantity,
  listed_product: {
    id: item.listed_product_id,
    name: item.listed_product_name,
    description: item.listed_product_description,
    size: item.listed_product_size,
    height: nullableStr(item.listed_product_height),
    width: nullableStr(item.listed_product_width),
    thumbnail_url: item.listed_product_thumbnail || null,
  },
  product_type: item.product_type_id ? {
    id: item.product_type_id,
    name: item.product_type_name,
    slug: item.product_type_slug,
  } : null,
  images: {
    preview_image_url: item.listed_product_thumbnail || null,
    uploaded_image_url: null,
  },
  pricing: {
    unit_price: parseFloat(item.unit_price || 0),
    total_price: parseFloat(item.total_price || 0),
    breakdown: {},
  },
});

const toNestedOrderItem = (item) => {
  if (item.listed_product_id) return toNestedListedOrderItem(item);
  return {
  id: item.id,
  order_id: item.order_id,
  item_type: 'custom',
  quantity: item.quantity,
  text_layers: parseTextLayers(item.text_layers),
  dimensions: {
    height: item.height,
    width: item.width,
    dimension_unit_id: item.dimension_unit_id,
    unit_name: item.unit_name,
    conversion_to_sqft: item.conversion_to_sqft,
  },
  images: {
    uploaded_image_url: nullableStr(item.uploaded_image_url),
    preview_image_url: nullableStr(item.preview_image_url || item.pylon_file_url || item.pylon_thumbnail_url),
  },
  product_type: {
    id: item.product_type_id,
    name: item.product_type_name,
    slug: item.product_type_slug,
  },
  material: item.material_id ? {
    id: item.material_id,
    name: item.material_name,
    description: nullableStr(item.material_description),
    file_url: nullableStr(item.material_file_url),
  } : null,
  material_style: item.material_style_id ? {
    id: item.material_style_id,
    name: item.material_style_name,
    description: nullableStr(item.material_style_description),
  } : null,
  frame: item.frame_id ? {
    id: item.frame_id,
    name: item.frame_name,
    description: nullableStr(item.frame_description),
    file_url: nullableStr(item.frame_file_url),
  } : null,
  wallpaper: item.wallpaper_id ? {
    id: item.wallpaper_id,
    name: item.wallpaper_name,
    wallpaper_type: item.wallpaper_type,
    description: nullableStr(item.wallpaper_description),
    file_url: nullableStr(item.wallpaper_file_url),
  } : null,
  add_border: item.add_border_id ? {
    id: item.add_border_id,
    shape: item.add_border_shape,
    size: item.add_border_size,
    height: nullableStr(item.add_border_height),
    width: nullableStr(item.add_border_width),
    border_is_lit: Boolean(item.border_is_lit),
    file_url: nullableStr(item.add_border_file_url),
  } : null,
  lollipop_element: item.lollipop_element_id ? {
    id: item.lollipop_element_id,
    name: item.lollipop_element_name,
    description: nullableStr(item.lollipop_element_description),
    image: nullableStr(item.lollipop_element_file_url || item.lollipop_element_thumbnail_url),
    file_url: nullableStr(item.lollipop_element_file_url),
    thumbnail_url: nullableStr(item.lollipop_element_thumbnail_url),
  } : null,
  pylon: item.pylon_id ? {
    id: item.pylon_id,
    name: item.pylon_name,
    description: nullableStr(item.pylon_description),
    thumbnail_url: nullableStr(item.pylon_thumbnail_url),
    file_url: nullableStr(item.pylon_file_url),
  } : null,
  pylon_category: item.pylon_category_id ? {
    id: item.pylon_category_id,
    name: item.pylon_category_name,
    tiles_name: item.pylon_tiles_name,
    category_price: parseFloat(item.pylon_category_price || 0),
    tiles_price: parseFloat(item.pylon_tiles_price || 0),
  } : null,
  tiles: item.pylon_id != null ? (parseInt(item.pylon_tiles_count, 10) || 0) : null,
  pylon_tiles_images: item.pylon_id != null ? parseUrlArray(item.pylon_tiles_images) : [],
  base: item.base_id ? {
    id: item.base_id,
    name: item.base_name,
    description: nullableStr(item.base_description),
    file_url: nullableStr(item.base_file_url),
  } : null,
  thickness: item.thickness_id ? {
    id: item.thickness_id,
    name: item.thickness_name,
    description: nullableStr(item.thickness_description),
    file_url: nullableStr(item.thickness_file_url),
  } : null,
  element: item.element_id ? {
    id: item.element_id,
    name: item.element_name,
    description: nullableStr(item.element_description),
    file_url: nullableStr(item.element_file_url),
  } : null,
  color: item.color_id ? {
    id: item.color_id,
    name: item.color_name,
    hex_code: item.hex_code,
  } : null,
  font: item.font_id ? {
    id: item.font_id,
    name: item.font_name,
    file_url: nullableStr(item.font_file_url),
  } : null,
  illumination_option: item.illumination_option_id ? {
    id: item.illumination_option_id,
    name: item.illumination_option_name,
    category: item.illumination_category,
    description: nullableStr(item.illumination_description),
  } : null,
  pricing: {
    unit_price: parseFloat(item.unit_price || 0),
    total_price: parseFloat(item.total_price || 0),
    breakdown: {
      price_per_sqft: parseFloat(item.price_per_sqft || 0),
      material_cost: parseFloat(item.material_cost || 0),
      material_style_price_per_sqft: parseFloat(item.material_style_price_per_sqft || 0),
      material_style_cost: parseFloat(item.material_style_cost || 0),
      frame_price_per_sqft: parseFloat(item.frame_price_per_sqft || 0),
      frame_cost: parseFloat(item.frame_cost || 0),
      wallpaper_price_per_sqft: parseFloat(item.wallpaper_price_per_sqft || 0),
      wallpaper_cost: parseFloat(item.wallpaper_cost || 0),
      add_border_base_price: parseFloat(item.add_border_base_price || 0),
      add_border_lit_extra: parseFloat(item.add_border_lit_extra || 0),
      add_border_cost: parseFloat(item.add_border_cost || 0),
      lollipop_element_cost: parseFloat(item.lollipop_element_cost || 0),
      pylon_category_price: parseFloat(item.pylon_category_price || 0),
      pylon_tiles_price: parseFloat(item.pylon_tiles_price || 0),
      pylon_category_cost: parseFloat(item.pylon_category_cost || 0),
      pylon_tiles_cost: parseFloat(item.pylon_tiles_cost || 0),
      base_price_per_sqft: parseFloat(item.base_price_per_sqft || 0),
      base_cost: parseFloat(item.base_cost || 0),
      thickness_price_per_sqft: parseFloat(item.thickness_price_per_sqft || 0),
      thickness_cost: parseFloat(item.thickness_cost || 0),
      element_cost: parseFloat(item.element_cost || 0),
      color_extra: parseFloat(item.color_extra || 0),
      illumination_cost: parseFloat(item.illumination_cost || 0),
    },
  },
  is_lollipop: String(item.product_type_id) === String(LOLLIPOP_PRODUCT_TYPE_ID)
    || item.product_type_slug === PRODUCT_SLUGS.LOLLIPOP_SIGN,
  is_pylon: item.product_type_slug === PRODUCT_SLUGS.PYLON_SIGN || !!item.pylon_id,
  };
};

const buildSeller = async (order) => {
  const sellerType = order.seller_type || (order.vendor_id ? 'vendor' : 'admin');
  if (sellerType === 'vendor' && order.vendor_id) {
    const vendor = await db.findOne(
      `SELECT v.id, v.business_name, v.gst_number, v.logo_url, v.address, v.city, v.state, v.pincode,
              u.name AS contact_name, u.email AS contact_email, u.phone AS contact_phone
       FROM vendors v
       LEFT JOIN users u ON u.id = v.user_id
       WHERE v.id = ?`,
      [order.vendor_id]
    );
    if (!vendor) return { type: 'vendor', id: order.vendor_id, business_name: order.vendor_name || null };
    return {
      type: 'vendor',
      id: vendor.id,
      business_name: vendor.business_name,
      gst_number: vendor.gst_number,
      logo_url: nullableStr(vendor.logo_url),
      contact_name: vendor.contact_name,
      contact_email: vendor.contact_email,
      contact_phone: vendor.contact_phone,
      address: {
        line: nullableStr(vendor.address),
        city: vendor.city,
        state: vendor.state,
        pincode: vendor.pincode,
      },
    };
  }
  const adminId = order.seller_id;
  const admin = adminId
    ? await db.findOne('SELECT id, name, email, phone FROM users WHERE id = ?', [adminId])
    : null;
  return {
    type: 'admin',
    id: admin?.id || adminId,
    business_name: process.env.ADMIN_BUSINESS_NAME || 'SignsUvidha',
    contact_name: admin?.name || null,
    contact_email: admin?.email || null,
    contact_phone: admin?.phone || null,
    logo_url: nullableStr(process.env.ADMIN_LOGO_URL || null),
  };
};

const buildPaymentBatch = async (order) => {
  if (!order.payment_batch_id) return null;
  const batch = await paymentBatchModel.getById(order.payment_batch_id);
  if (!batch) return null;
  return {
    id: batch.id,
    batch_number: batch.batch_number,
    total_order_amount: parseFloat(batch.total_order_amount || 0),
    gst_percent: parseFloat(batch.gst_percent || 0),
    gst_amount: parseFloat(batch.gst_amount || 0),
    payable_amount: parseFloat(batch.payable_amount || 0),
    payment_status: batch.payment_status,
    payment_method: batch.payment_method,
  };
};

const buildPayment = (order) => ({
  payment_method: order.payment_method,
  payment_status: order.payment_status,
  payment_transaction_id: order.payment_transaction_id || null,
  payment_batch_id: order.payment_batch_id || null,
});

const buildAmounts = (order) => ({
  subtotal: parseFloat(order.subtotal || 0),
  shipping_cost: parseFloat(order.shipping_cost || 0),
  total_amount: parseFloat(order.total_amount || 0),
  gst_percent: parseFloat(order.gst_percent || 0),
  gst_amount: parseFloat(order.gst_amount || 0),
  payable_amount: parseFloat(order.payable_amount || 0),
});

const maskOrderNumbers = (order) => ({
  order_number: order.payment_status === 'paid' ? order.order_number : null,
  invoice_number: order.payment_status === 'paid' ? order.invoice_number : null,
});

const getAdminSellerId = async () => {
  const admin = await db.findOne(
    `SELECT u.id FROM users u
     INNER JOIN user_roles ur ON ur.user_id = u.id
     INNER JOIN roles r ON r.id = ur.role_id
     WHERE r.name = 'super_admin' ORDER BY u.id ASC LIMIT 1`
  );
  return admin?.id || null;
};

const enrichOrder = async (order, itemsByOrderId, adminSellerId, options = {}) => {
  const { maskNumbers = true, includeCustomer = false } = options;
  const sellerType = order.seller_type || (order.vendor_id ? 'vendor' : 'admin');
  const sellerId = order.seller_id || (order.vendor_id ? order.vendor_id : adminSellerId);

  const numbers = maskNumbers
    ? maskOrderNumbers(order)
    : { order_number: order.order_number, invoice_number: order.invoice_number || null };

  const [shippingAddress, billingAddress, seller, paymentBatch] = await Promise.all([
    order.shipping_address_id
      ? addressModel.getById(order.shipping_address_id, order.customer_user_id)
      : null,
    !order.billing_same_as_shipping && order.billing_address_id
      ? addressModel.getById(order.billing_address_id, order.customer_user_id)
      : null,
    buildSeller(order),
    buildPaymentBatch(order),
  ]);

  const rawItems = itemsByOrderId?.get(order.id) || await orderModel.getOrderItemsEnriched(order.id);
  const items = rawItems.map(toNestedOrderItem);
  const previewImages = items
    .map((i) => i.images.preview_image_url || i.images.uploaded_image_url)
    .filter(Boolean);

  const amounts = buildAmounts(order);
  const payment = buildPayment(order);

  return {
    id: order.id,
    ...numbers,
    status: order.status,
    notes: order.notes || null,
    seller_type: sellerType,
    seller_id: sellerId,
    seller,
    payment,
    payment_batch: paymentBatch,
    amounts,
    ...amounts,
    ...payment,
    shipping: {
      service_id: order.shipping_service_id,
      service_name: order.shipping_service_name || null,
      cost: parseFloat(order.shipping_cost || 0),
    },
    addresses: {
      billing_same_as_shipping: !!order.billing_same_as_shipping,
      shipping: formatAddress(shippingAddress),
      billing: order.billing_same_as_shipping
        ? formatAddress(shippingAddress)
        : formatAddress(billingAddress),
    },
    items,
    item_count: items.length,
    preview_images: previewImages,
    created_at: order.created_at,
    updated_at: order.updated_at,
    ...(includeCustomer ? {
      customer_name: order.customer_name || null,
      customer_email: order.customer_email || null,
      customer_phone: order.customer_phone || null,
      vendor_name: order.vendor_name || seller?.business_name || null,
      customer: {
        name: order.customer_name || null,
        email: order.customer_email || null,
        phone: order.customer_phone || null,
      },
    } : {}),
  };
};

const enrichOrders = async (orders, adminSellerId, options = {}) => {
  if (!orders.length) return [];
  const orderIds = orders.map((o) => o.id);
  const allItems = await orderModel.getOrderItemsEnrichedByOrderIds(orderIds);
  const itemsByOrderId = new Map();
  allItems.forEach((item) => {
    if (!itemsByOrderId.has(item.order_id)) itemsByOrderId.set(item.order_id, []);
    itemsByOrderId.get(item.order_id).push(item);
  });
  return Promise.all(orders.map((o) => enrichOrder(o, itemsByOrderId, adminSellerId, options)));
};

const enrichOrderForPanel = (order, itemsByOrderId, adminSellerId) =>
  enrichOrder(order, itemsByOrderId, adminSellerId, { maskNumbers: false, includeCustomer: true });

const enrichOrdersForPanel = async (orders) => {
  const adminSellerId = await getAdminSellerId();
  return enrichOrders(orders, adminSellerId, { maskNumbers: false, includeCustomer: true });
};

module.exports = {
  enrichOrder,
  enrichOrders,
  enrichOrderForPanel,
  enrichOrdersForPanel,
  getAdminSellerId,
  toNestedOrderItem,
  formatAddress,
};
