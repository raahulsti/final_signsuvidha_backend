const Joi = require('joi');
const { BORDER_SHAPES, BORDER_SIZES, LOLLIPOP_PRODUCT_TYPE_ID } = require('../../utils/constants');

const create = Joi.object({
  product_type_id: Joi.number().integer().positive().default(LOLLIPOP_PRODUCT_TYPE_ID),
  shape:           Joi.string().valid(...BORDER_SHAPES).required(),
  size:            Joi.string().valid(...BORDER_SIZES).required(),
  height:          Joi.string().max(150).optional().allow('', null),
  width:           Joi.string().max(150).optional().allow('', null),
  admin_price:     Joi.number().min(0).required(),
  lit_price:       Joi.number().min(0).required(),
  sort_order:      Joi.number().integer().min(0).optional(),
  is_active:       Joi.boolean().truthy('true', '1', 1).falsy('false', '0', 0, '').optional(),
});

const update = create.fork(
  ['shape', 'size', 'admin_price', 'lit_price'],
  (schema) => schema.optional()
);

module.exports = { create, update };
