const Joi = require('joi');

const create = Joi.object({
  product_type_id:   Joi.number().integer().positive().required(),
  name:              Joi.string().min(2).max(100).required(),
  price_multiplier:  Joi.number().min(0.1).max(10).optional(),
  admin_price_extra: Joi.number().min(0).optional(),
  is_active:         Joi.boolean().optional(),
});

const update = create.fork(
  ['product_type_id','name'],
  (schema) => schema.optional()
);

module.exports = { create, update };
