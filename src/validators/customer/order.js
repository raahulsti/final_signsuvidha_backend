const Joi = require('joi');

const checkout = Joi.object({
  shipping_address_id:      Joi.number().integer().positive().required(),
  billing_same_as_shipping: Joi.boolean().optional(),
  billing_address_id:       Joi.number().integer().positive().optional().allow(null),
  shipping_service_id:      Joi.number().integer().positive().required(),
  notes:                    Joi.string().max(500).optional().allow(''),
});

const payment = Joi.object({
  payment_method: Joi.string()
    .valid('phonepe','googlepay','paytm','card','netbanking','cod')
    .required(),
});

module.exports = { checkout, payment };
