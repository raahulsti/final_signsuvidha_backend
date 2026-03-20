const Joi = require('joi');

const create = Joi.object({
  product_type_id:   Joi.number().integer().positive().required(),
  element_type_id:   Joi.number().integer().positive().required(),
  name:              Joi.string().min(2).max(150).required(),
  description:       Joi.string().max(1000).optional().allow(''),
  admin_price_extra: Joi.number().min(0).optional(),
  sort_order:        Joi.number().integer().min(0).optional(),
  is_active:         Joi.boolean().optional(),
});

const update = create.fork(
  ['product_type_id','element_type_id','name'],
  (schema) => schema.optional()
);

module.exports = { create, update };
