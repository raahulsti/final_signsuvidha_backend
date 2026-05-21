const Joi = require('joi');

const create = Joi.object({
  name:                 Joi.string().min(1).max(150).required(),
  admin_category_price: Joi.number().min(0).required(),
  tiles_name:           Joi.string().min(1).max(150).required(),
  admin_tiles_price:    Joi.number().min(0).required(),
  sort_order:           Joi.number().integer().min(0).optional(),
  is_active:            Joi.boolean().truthy('true', '1', 1).falsy('false', '0', 0, '').optional(),
});

const update = Joi.object({
  name:                 Joi.string().min(1).max(150).optional(),
  admin_category_price: Joi.number().min(0).optional(),
  tiles_name:           Joi.string().min(1).max(150).optional(),
  admin_tiles_price:    Joi.number().min(0).optional(),
  sort_order:           Joi.number().integer().min(0).optional(),
  is_active:            Joi.boolean().truthy('true', '1', 1).falsy('false', '0', 0, '').optional(),
});

module.exports = { create, update };
