const Joi = require('joi');

const checkout = Joi.object({
  shipping_address_id:      Joi.number().integer().positive().required(),
  billing_same_as_shipping: Joi.boolean().optional(),
  billing_address_id:       Joi.number().integer().positive().optional().allow(null),
  shipping_service_id:      Joi.number().integer().positive().optional().allow(null),
  notes:                    Joi.string().max(500).optional().allow(''),
});

const payment = Joi.object({
  payment_method: Joi.string()
    .valid('razorpay','phonepe','googlepay','paytm','card','netbanking','cod')
    .required(),
});

const verifyPayment = Joi.object({
  payment_batch_id: Joi.number().integer().positive().optional(),
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
});

const initiateBatchPayment = Joi.object({
  payment_batch_id: Joi.number().integer().positive().required(),
  payment_method: Joi.string().valid('razorpay', 'cod').required(),
});

const failBatchPayment = Joi.object({
  payment_batch_id: Joi.number().integer().positive().required(),
  payment_method: Joi.string().valid('razorpay', 'cod').default('razorpay'),
  razorpay_order_id: Joi.string().optional().allow('', null),
  razorpay_payment_id: Joi.string().optional().allow('', null),
  reason: Joi.string().max(500).optional().allow('', null),
});

module.exports = { checkout, payment, verifyPayment, initiateBatchPayment, failBatchPayment };
