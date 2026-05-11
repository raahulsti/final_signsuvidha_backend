const db = require('../config/db');

const create = async (conn, { customer_user_id, vendor_id, order_number, shipping_address_id,
                               billing_address_id, billing_same_as_shipping, shipping_service_id,
                               shipping_cost, subtotal, total_amount, seller_type, seller_id,
                               gst_percent, gst_amount, payable_amount, notes }) => {
  const [result] = await conn.execute(
    `INSERT INTO orders
       (customer_user_id, vendor_id, seller_type, seller_id, order_number, shipping_address_id, billing_address_id,
        billing_same_as_shipping, shipping_service_id, shipping_cost, subtotal, total_amount,
        gst_percent, gst_amount, payable_amount, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [customer_user_id, vendor_id || null, seller_type || 'admin', seller_id || null, order_number,
     shipping_address_id, billing_address_id || null, billing_same_as_shipping ?? 1,
     shipping_service_id || null, shipping_cost || 0, subtotal || 0, total_amount || 0,
     gst_percent || 0, gst_amount || 0, payable_amount || total_amount || 0, notes || null]
  );
  return result.insertId;
};

const createItem = (conn, item) => {
  const { order_id, product_type_id, material_id, base_id, thickness_id, element_id, color_id, font_id,
          illumination_option_id, text_layers, height, width, dimension_unit_id,
          uploaded_image_url, price_per_sqft, material_cost, base_price_per_sqft, base_cost,
          thickness_price_per_sqft, thickness_cost,
          element_cost, color_extra, illumination_cost, unit_price, quantity, total_price, preview_image_url } = item;
  return conn.execute(
    `INSERT INTO order_items
       (order_id, product_type_id, material_id, base_id, thickness_id, element_id, color_id, font_id,
        illumination_option_id, text_layers, height, width, dimension_unit_id, uploaded_image_url,
        price_per_sqft, material_cost, base_price_per_sqft, base_cost, thickness_price_per_sqft, thickness_cost,
        element_cost, color_extra, illumination_cost,
        unit_price, quantity, total_price, preview_image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [order_id, product_type_id, material_id || null, base_id || null, thickness_id || null, element_id || null,
     color_id || null, font_id || null, illumination_option_id || null,
     text_layers ? JSON.stringify(text_layers) : null,
     height, width, dimension_unit_id, uploaded_image_url || null,
     price_per_sqft, material_cost, base_price_per_sqft ?? 0, base_cost ?? 0,
     thickness_price_per_sqft ?? 0, thickness_cost ?? 0,
     element_cost, color_extra, illumination_cost ?? 0,
     unit_price, quantity, total_price, preview_image_url || null]
  );
};

const getByCustomer = ({ userId, status, offset, limit }) => {
  const conds = ['o.customer_user_id = ?']; const vals = [userId];
  if (status) { conds.push('o.status = ?'); vals.push(status); }
  const sql = `
    SELECT o.*, inv.invoice_number, v.business_name AS vendor_name, ss.name AS shipping_service_name
    FROM orders o
    LEFT JOIN order_invoice_numbers inv ON inv.order_id = o.id
    LEFT JOIN vendors v          ON v.id  = o.vendor_id
    LEFT JOIN shipping_services ss ON ss.id = o.shipping_service_id
    WHERE ${conds.join(' AND ')}
    ORDER BY o.created_at DESC LIMIT ? OFFSET ?
  `;
  return db.paginate(sql, `SELECT COUNT(*) AS total FROM orders o WHERE ${conds.join(' AND ')}`,
    [...vals, limit, offset], vals);
};

const getById = (id) =>
  db.findOne(
    `SELECT o.*, inv.invoice_number, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
            v.business_name AS vendor_name, ss.name AS shipping_service_name
     FROM orders o
     LEFT JOIN order_invoice_numbers inv ON inv.order_id = o.id
     LEFT JOIN users u              ON u.id  = o.customer_user_id
     LEFT JOIN vendors v            ON v.id  = o.vendor_id
     LEFT JOIN shipping_services ss ON ss.id  = o.shipping_service_id
     WHERE o.id = ?`, [id]
  );

const getOrderItems = (orderId) =>
  db.execute(
    `SELECT oi.*, pt.name AS product_type_name, pt.name AS product_name
     FROM order_items oi
     LEFT JOIN product_types pt ON pt.id = oi.product_type_id
     WHERE oi.order_id = ?`, [orderId]
  );

const updateStatus = (id, status) =>
  db.execute('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);

const updatePayment = (id, { payment_method, payment_status, payment_transaction_id }) =>
  db.execute(
    'UPDATE orders SET payment_method = ?, payment_status = ?, payment_transaction_id = ?, updated_at = NOW() WHERE id = ?',
    [payment_method, payment_status, payment_transaction_id, id]
  );

const updateOrderNumber = (id, orderNumber) =>
  db.execute(
    'UPDATE orders SET order_number = ?, updated_at = NOW() WHERE id = ?',
    [orderNumber, id]
  );

const updatePaymentBatchId = (conn, id, paymentBatchId) =>
  conn.execute(
    'UPDATE orders SET payment_batch_id = ?, updated_at = NOW() WHERE id = ?',
    [paymentBatchId, id]
  );

module.exports = { create, createItem, getByCustomer, getById, getOrderItems, updateStatus, updatePayment, updateOrderNumber, updatePaymentBatchId };

// Admin: get all orders
const getAll = ({ status, vendorId, offset, limit }) => {
  const conds = []; const vals = [];
  if (status)   { conds.push('o.status = ?');    vals.push(status); }
  if (vendorId) { conds.push('o.vendor_id = ?'); vals.push(vendorId); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const sql = `
    SELECT o.*, inv.invoice_number, u.name AS customer_name, v.business_name AS vendor_name
    FROM orders o
    LEFT JOIN order_invoice_numbers inv ON inv.order_id = o.id
    LEFT JOIN users u   ON u.id = o.customer_user_id
    LEFT JOIN vendors v ON v.id = o.vendor_id
    ${where}
    ORDER BY o.created_at DESC LIMIT ? OFFSET ?
  `;
  return db.paginate(sql, `SELECT COUNT(*) AS total FROM orders o ${where}`,
    [...vals, limit, offset], vals);
};

// Vendor: get orders assigned to vendor
const getByVendor = ({ vendorId, status, offset, limit }) => {
  const conds = ['o.vendor_id = ?']; const vals = [vendorId];
  if (status) { conds.push('o.status = ?'); vals.push(status); }
  const sql = `
    SELECT o.*, inv.invoice_number, u.name AS customer_name
    FROM orders o LEFT JOIN users u ON u.id = o.customer_user_id
    LEFT JOIN order_invoice_numbers inv ON inv.order_id = o.id
    WHERE ${conds.join(' AND ')}
    ORDER BY o.created_at DESC LIMIT ? OFFSET ?
  `;
  return db.paginate(sql, `SELECT COUNT(*) AS total FROM orders o WHERE ${conds.join(' AND ')}`,
    [...vals, limit, offset], vals);
};

module.exports = Object.assign(module.exports, { getAll, getByVendor });
