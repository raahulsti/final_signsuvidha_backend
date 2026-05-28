const notificationModel = require('../models/notificationModel');
const vendorModel = require('../models/vendorModel');
const orderModel = require('../models/orderModel');

const orderLabel = (order) => {
  if (order?.order_number && !String(order.order_number).startsWith('PENDING-')) {
    return order.order_number;
  }
  return `Order #${order?.id}`;
};

const orderNavData = (order) => ({
  screen: 'OrderDetail',
  order_id: order.id,
  order_number: order.order_number || null,
});

const sendToUser = async ({ userId, type, title, body, order }) => {
  if (!userId) return;
  try {
    await notificationModel.create({
      user_id: userId,
      type,
      title,
      body,
      reference_type: 'order',
      reference_id: order?.id || null,
      data: order ? orderNavData(order) : null,
    });
  } catch (err) {
    console.error('[notification]', type, userId, err.message);
  }
};

const getOrderById = (orderId) => orderModel.getById(orderId);

const notifyVendorForOrder = async (order, { type, title, body }) => {
  if (!order?.vendor_id) return;
  const vendor = await vendorModel.getById(order.vendor_id);
  if (!vendor?.user_id) return;
  await sendToUser({ userId: vendor.user_id, type, title, body, order });
};

exports.notifyCustomerOrderConfirmed = async (orderId, { paymentMethod } = {}) => {
  const order = await getOrderById(orderId);
  if (!order?.customer_user_id) return;
  const label = orderLabel(order);
  const body = paymentMethod === 'cod'
    ? `${label} is confirmed. Pay on delivery.`
    : `Payment received. ${label} is confirmed.`;
  await sendToUser({
    userId: order.customer_user_id,
    type: 'order_confirmed',
    title: 'Order confirmed',
    body,
    order,
  });
};

exports.notifyVendorNewOrder = async (orderId) => {
  const order = await getOrderById(orderId);
  if (!order) return;
  const label = orderLabel(order);
  await notifyVendorForOrder(order, {
    type: 'order_new',
    title: 'New order received',
    body: `You have a new order: ${label}.`,
  });
};

exports.notifyCustomerOrderStatusChanged = async (order, newStatus) => {
  if (!order?.customer_user_id || !newStatus) return;

  const label = orderLabel(order);
  const statusMessages = {
    confirmed: {
      type: 'order_confirmed',
      title: 'Order confirmed',
      body: `${label} has been confirmed.`,
    },
    processing: {
      type: 'order_processing',
      title: 'Order in processing',
      body: `${label} is now being processed.`,
    },
    shipped: {
      type: 'order_shipped',
      title: 'Order shipped',
      body: `${label} has been shipped.`,
    },
    delivered: {
      type: 'order_delivered',
      title: 'Order delivered',
      body: `${label} has been delivered.`,
    },
    cancelled: {
      type: 'order_cancelled',
      title: 'Order cancelled',
      body: `${label} has been cancelled.`,
    },
    refunded: {
      type: 'order_refunded',
      title: 'Order refunded',
      body: `${label} has been refunded.`,
    },
  };

  const msg = statusMessages[newStatus];
  if (!msg) return;

  await sendToUser({
    userId: order.customer_user_id,
    type: msg.type,
    title: msg.title,
    body: msg.body,
    order,
  });
};

exports.notifyCheckoutOrders = async (orderIds = []) => {
  for (const orderId of orderIds) {
    await exports.notifyCustomerOrderPlaced(orderId);
  }
};

exports.notifyPaymentVerifiedOrders = async (orderIds = []) => {
  for (const orderId of orderIds) {
    await exports.notifyCustomerOrderConfirmed(orderId);
    await exports.notifyVendorNewOrder(orderId);
  }
};

exports.notifyCodOrders = async (orderIds = []) => {
  for (const orderId of orderIds) {
    await exports.notifyCustomerOrderConfirmed(orderId, { paymentMethod: 'cod' });
    await exports.notifyVendorNewOrder(orderId);
  }
};
