const Joi = require('joi');

const textLayer = Joi.object({
  text:      Joi.string().max(500).required(),
  color:     Joi.string().optional().allow(''),
  font_id:   Joi.number().integer().positive().optional(),
  font_size: Joi.number().integer().min(1).optional(),
  x:         Joi.number().optional(),
  y:         Joi.number().optional(),
});

const addToCart = Joi.object({
  product_type_id:   Joi.number().integer().positive().required(),
  material_id:       Joi.number().integer().positive().optional().allow(null),
  element_id:        Joi.number().integer().positive().optional().allow(null),
  color_id:          Joi.number().integer().positive().optional().allow(null),
  font_id:           Joi.number().integer().positive().optional().allow(null),
  letter_style_id:   Joi.number().integer().positive().optional().allow(null),
  text_layers:       Joi.array().items(textLayer).optional(),
  height:            Joi.number().min(0).optional(),
  width:             Joi.number().min(0).optional(),
  dimension_unit_id: Joi.number().integer().positive().optional().allow(null),
  quantity:          Joi.number().integer().min(1).max(100).optional(),
});

const selectVendor = Joi.object({
  vendor_id: Joi.number().integer().positive().optional().allow(null),
});

module.exports = { addToCart, selectVendor };
