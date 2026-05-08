const crypto = require('crypto');
const Razorpay = require('razorpay');

const getClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    const err = new Error('Razorpay is not configured');
    err.statusCode = 500;
    throw err;
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const createOrder = async ({ amountInPaise, receipt, notes = {} }) => {
  const client = getClient();
  return client.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt,
    payment_capture: 1,
    notes,
  });
};

const verifySignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest('hex');
  return expected === razorpay_signature;
};

module.exports = { createOrder, verifySignature };
