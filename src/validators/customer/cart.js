const Joi = require('joi');

const textLayer = Joi.object({
  text:      Joi.string().max(500).required(),
  color:     Joi.string().optional().allow(''),
  font_id:   Joi.number().integer().positive().optional(),
  font_size: Joi.number().integer().min(1).optional(),
  x:         Joi.number().optional(),
  y:         Joi.number().optional(),
});

const textLayerArray = Joi.array().items(textLayer);

const textLayersField = Joi.alternatives()
  .try(
    textLayerArray,
    Joi.string().custom((value, helpers) => {
      try {
        const parsed = JSON.parse(value);
        const { error, value: validated } = textLayerArray.validate(parsed);
        if (error) return helpers.error('any.invalid');
        return validated;
      } catch (_) {
        return helpers.error('any.invalid');
      }
    }, 'text_layers JSON parser')
  )
  .messages({ 'any.invalid': 'text_layers must be a valid JSON array' });

const addToCart = Joi.object({
  product_type_id:   Joi.number().integer().positive().required(),
  material_id:       Joi.number().integer().positive().optional().allow(null),
  material_style_id: Joi.number().integer().positive().optional().allow(null),
  frame_id:          Joi.number().integer().positive().optional().allow(null),
  wallpaper_id:      Joi.number().integer().positive().optional().allow(null),
  add_border_id:     Joi.number().integer().positive().optional().allow(null),
  border_is_lit:     Joi.boolean().truthy('true', '1', 1).falsy('false', '0', 0, '').optional(),
  lollipop_element_id: Joi.number().integer().positive().optional().allow(null),
  base_id:           Joi.number().integer().positive().optional().allow(null),
  thickness_id:      Joi.number().integer().positive().optional().allow(null),
  element_id:        Joi.number().integer().positive().optional().allow(null),
  color_id:          Joi.number().integer().positive().optional().allow(null),
  font_id:           Joi.number().integer().positive().optional().allow(null),
  illumination_option_id: Joi.number().integer().positive().optional().allow(null),
  text_layers:       textLayersField.optional(),
  height:            Joi.number().min(0).optional(),
  width:             Joi.number().min(0).optional(),
  dimension_unit_id: Joi.number().integer().positive().optional().allow(null),
  uploaded_image_url: Joi.string().max(2000).optional().allow(null, ''),
  preview_image_url:  Joi.string().max(2000).optional().allow(null, ''),
  quantity:          Joi.number().integer().min(1).max(100).optional(),
});

const selectVendor = Joi.object({
  vendor_id: Joi.number().integer().positive().optional().allow(null),
});

module.exports = { addToCart, selectVendor };
