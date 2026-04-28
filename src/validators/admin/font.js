const Joi = require('joi');

const create = Joi.object({
  name:             Joi.string().min(2).max(100).required(),
  sort_order:       Joi.number().integer().min(0).optional(),
  product_type_ids: Joi.array().items(Joi.number().integer().positive()).optional(),
  product_type_prices: Joi.array().items(
    Joi.object({
      product_type_id: Joi.number().integer().positive().required(),
      admin_price_extra: Joi.number().min(0).required(),
      is_active: Joi.boolean().optional(),
    })
  ).min(1).required(),
});

const update = create.fork(['name'], (schema) => schema.optional());

module.exports = { create, update };
