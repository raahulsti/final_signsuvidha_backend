const Joi = require('joi');
const { BORDER_SHAPES, BORDER_SIZES, LOLLIPOP_PRODUCT_TYPE_ID } = require('../../utils/constants');

const create = Joi.object({
  product_type_id: Joi.number().integer().positive().default(LOLLIPOP_PRODUCT_TYPE_ID),
  shape:           Joi.string().valid(...BORDER_SHAPES).required(),
  size:            Joi.string().valid(...BORDER_SIZES).required(),
  name:            Joi.string().max(150).optional().allow(''),
  description:     Joi.string().max(1000).optional().allow(''),
  admin_price:     Joi.number().min(0).required(),
  lit_price:       Joi.number().min(0).required(),
  sort_order:      Joi.number().integer().min(0).optional(),
  is_active:       Joi.boolean().optional(),
});

const update = create.fork(
  ['shape', 'size', 'admin_price', 'lit_price'],
  (schema) => schema.optional()
);

module.exports = { create, update };
