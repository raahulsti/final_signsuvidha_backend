const db = require('../config/db');

const create = async (conn, { customer_user_id, vendor_id, order_number, shipping_address_id,
                               billing_address_id, billing_same_as_shipping, shipping_service_id,
                               shipping_cost, subtotal, total_amount, notes }) => {
  const [result] = await conn.execute(
    `INSERT INTO orders
       (customer_user_id, vendor_id, order_number, shipping_address_id, billing_address_id,
        billing_same_as_shipping, shipping_service_id, shipping_cost, subtotal, total_amount, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [customer_user_id, vendor_id, order_number, shipping_address_id,
     billing_address_id || null, billing_same_as_shipping ?? 1,
     shipping_service_id, shipping_cost || 0, subtotal, total_amount, notes || null]
  );
  return result.insertId;
};

const createItem = (conn, item) => {
  const { order_id, product_type_id, material_id, element_id, color_id, font_id,
          letter_style_id, text_layers, height, width, dimension_unit_id,
          uploaded_image_url, price_per_sqft, material_cost, element_cost,
          color_extra, letter_style_extra, unit_price, quantity, total_price, preview_image_url } = item;
  return conn.execute(
    `INSERT INTO order_items
       (order_id, product_type_id, material_id, element_id, color_id, font_id,
        letter_style_id, text_layers, height, width, dimension_unit_id, uploaded_image_url,
        price_per_sqft, material_cost, element_cost, color_extra, letter_style_extra,
        unit_price, quantity, total_price, preview_image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [order_id, product_type_id, material_id || null, element_id || null,
     color_id || null, font_id || null, letter_style_id || null,
     text_layers ? JSON.stringify(text_layers) : null,
     height, width, dimension_unit_id, uploaded_image_url || null,
     price_per_sqft, material_cost, element_cost, color_extra,
     letter_style_extra, unit_price, quantity, total_price, preview_image_url || null]
  );
};

const getByCustomer = ({ userId, status, offset, limit }) => {
  const conds = ['o.customer_user_id = ?']; const vals = [userId];
  if (status) { conds.push('o.status = ?'); vals.push(status); }
  const sql = `
    SELECT o.*, v.business_name AS vendor_name, ss.name AS shipping_service_name
    FROM orders o
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
    `SELECT o.*, v.business_name AS vendor_name, ss.name AS shipping_service_name
     FROM orders o
     LEFT JOIN vendors v            ON v.id  = o.vendor_id
     LEFT JOIN shipping_services ss ON ss.id  = o.shipping_service_id
     WHERE o.id = ?`, [id]
  );

const getOrderItems = (orderId) =>
  db.execute(
    `SELECT oi.*, pt.name AS product_type_name
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

module.exports = { create, createItem, getByCustomer, getById, getOrderItems, updateStatus, updatePayment };

// Admin: get all orders
const getAll = ({ status, vendorId, offset, limit }) => {
  const conds = []; const vals = [];
  if (status)   { conds.push('o.status = ?');    vals.push(status); }
  if (vendorId) { conds.push('o.vendor_id = ?'); vals.push(vendorId); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const sql = `
    SELECT o.*, u.name AS customer_name, v.business_name AS vendor_name
    FROM orders o
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
    SELECT o.*, u.name AS customer_name
    FROM orders o LEFT JOIN users u ON u.id = o.customer_user_id
    WHERE ${conds.join(' AND ')}
    ORDER BY o.created_at DESC LIMIT ? OFFSET ?
  `;
  return db.paginate(sql, `SELECT COUNT(*) AS total FROM orders o WHERE ${conds.join(' AND ')}`,
    [...vals, limit, offset], vals);
};

module.exports = Object.assign(module.exports, { getAll, getByVendor });
