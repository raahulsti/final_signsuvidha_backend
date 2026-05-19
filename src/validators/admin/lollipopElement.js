const Joi = require('joi');
const { LOLLIPOP_ELEMENT_SHAPES, LOLLIPOP_PRODUCT_TYPE_ID } = require('../../utils/constants');

const create = Joi.object({
  product_type_id: Joi.number().integer().positive().default(LOLLIPOP_PRODUCT_TYPE_ID),
  shape:           Joi.string().valid(...LOLLIPOP_ELEMENT_SHAPES).required(),
  name:            Joi.string().max(150).optional().allow(''),
  description:     Joi.string().max(1000).optional().allow(''),
  admin_price:     Joi.number().min(0).required(),
  sort_order:      Joi.number().integer().min(0).optional(),
  is_active:       Joi.boolean().optional(),
});

const update = create.fork(['shape', 'admin_price'], (schema) => schema.optional());

module.exports = { create, update };
