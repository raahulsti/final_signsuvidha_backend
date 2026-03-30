const Joi = require('joi');

const create = Joi.object({
  product_type_id: Joi.number().integer().positive().required(),
  image_type: Joi.string().min(2).max(50).required(),
  title: Joi.string().max(150).optional().allow(''),
  sort_order: Joi.number().integer().min(0).optional(),
  is_active: Joi.boolean().optional(),
});

const update = Joi.object({
  product_type_id: Joi.number().integer().positive().optional(),
  image_type: Joi.string().min(2).max(50).optional(),
  title: Joi.string().max(150).optional().allow(''),
  sort_order: Joi.number().integer().min(0).optional(),
  is_active: Joi.boolean().optional(),
});

module.exports = { create, update };
