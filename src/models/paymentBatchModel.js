const db = require('../config/db');

const create = async (conn, payload) => {
  const {
    customer_user_id,
    batch_number,
    total_order_amount,
    gst_percent,
    gst_amount,
    payable_amount,
  } = payload;
  const [result] = await conn.execute(
    `INSERT INTO order_payment_batches
      (customer_user_id, batch_number, total_order_amount, gst_percent, gst_amount, payable_amount, payment_status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    [customer_user_id, batch_number, total_order_amount, gst_percent, gst_amount, payable_amount]
  );
  return result.insertId;
};

const attachOrder = (conn, paymentBatchId, orderId) =>
  conn.execute(
    `INSERT INTO order_payment_batch_items (payment_batch_id, order_id)
     VALUES (?, ?)`,
    [paymentBatchId, orderId]
  );

const getById = (id) =>
  db.findOne(
    `SELECT * FROM order_payment_batches
     WHERE id = ?`,
    [id]
  );

const getByIdAndCustomer = (id, customerUserId) =>
  db.findOne(
    `SELECT * FROM order_payment_batches
     WHERE id = ? AND customer_user_id = ?`,
    [id, customerUserId]
  );

const getByOrderIdAndCustomer = (orderId, customerUserId) =>
  db.findOne(
    `SELECT b.*
     FROM order_payment_batches b
     INNER JOIN order_payment_batch_items i ON i.payment_batch_id = b.id
     WHERE i.order_id = ? AND b.customer_user_id = ?`,
    [orderId, customerUserId]
  );

const getOrdersByBatch = (batchId) =>
  db.execute(
    `SELECT o.*
     FROM order_payment_batch_items i
     INNER JOIN orders o ON o.id = i.order_id
     WHERE i.payment_batch_id = ?`,
    [batchId]
  );

const updateGatewayOrder = (id, { payment_method, gateway_order_id }) =>
  db.execute(
    `UPDATE order_payment_batches
     SET payment_method = ?, gateway_order_id = ?, payment_status = 'pending', updated_at = NOW()
     WHERE id = ?`,
    [payment_method, gateway_order_id, id]
  );

const markPaid = (id, { payment_method, gateway_order_id, gateway_payment_id, gateway_signature }) =>
  db.execute(
    `UPDATE order_payment_batches
     SET payment_method = ?, gateway_order_id = ?, gateway_payment_id = ?, gateway_signature = ?,
         payment_status = 'paid', updated_at = NOW()
     WHERE id = ?`,
    [payment_method, gateway_order_id, gateway_payment_id, gateway_signature, id]
  );

const markFailed = (id, { payment_method, gateway_order_id, gateway_payment_id = null, gateway_signature = null }) =>
  db.execute(
    `UPDATE order_payment_batches
     SET payment_method = ?, gateway_order_id = ?, gateway_payment_id = ?, gateway_signature = ?,
         payment_status = 'failed', updated_at = NOW()
     WHERE id = ?`,
    [payment_method, gateway_order_id, gateway_payment_id, gateway_signature, id]
  );

module.exports = {
  create,
  attachOrder,
  getById,
  getByIdAndCustomer,
  getByOrderIdAndCustomer,
  getOrdersByBatch,
  updateGatewayOrder,
  markPaid,
  markFailed,
};
