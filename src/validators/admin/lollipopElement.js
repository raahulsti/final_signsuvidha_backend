const Joi = require('joi');
const { LOLLIPOP_PRODUCT_TYPE_ID } = require('../../utils/constants');

const create = Joi.object({
  product_type_id: Joi.number().integer().positive().default(LOLLIPOP_PRODUCT_TYPE_ID),
  name:            Joi.string().max(150).required(),
  description:     Joi.string().max(1000).optional().allow('', null),
  admin_price:     Joi.number().min(0).required(),
  sort_order:      Joi.number().integer().min(0).optional(),
  is_active:       Joi.boolean().truthy('true', '1', 1).falsy('false', '0', 0, '').optional(),
});

const update = Joi.object({
  product_type_id: Joi.number().integer().positive().optional(),
  name:            Joi.string().max(150).optional(),
  description:     Joi.string().max(1000).optional().allow('', null),
  admin_price:     Joi.number().min(0).optional(),
  sort_order:      Joi.number().integer().min(0).optional(),
  is_active:       Joi.boolean().truthy('true', '1', 1).falsy('false', '0', 0, '').optional(),
});

module.exports = { create, update };
