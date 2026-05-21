const Joi = require('joi');

const create = Joi.object({
  product_type_id: Joi.number().integer().positive().required(),
  name:            Joi.string().min(2).max(200).required(),
  description:     Joi.string().max(5000).optional().allow(''),
  sort_order:      Joi.number().integer().min(0).optional(),
  is_active:       Joi.boolean().truthy('true', '1', 1).falsy('false', '0', 0, '').optional(),
});

const update = Joi.object({
  product_type_id: Joi.number().integer().positive().optional(),
  name:            Joi.string().min(2).max(200).optional(),
  description:     Joi.string().max(5000).optional().allow(''),
  sort_order:      Joi.number().integer().min(0).optional(),
  is_active:       Joi.boolean().truthy('true', '1', 1).falsy('false', '0', 0, '').optional(),
});

module.exports = { create, update };
