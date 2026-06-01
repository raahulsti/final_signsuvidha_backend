const Joi = require('joi');

/** Each layer: only `text` required; other keys optional and may differ per layer. */
const textLayer = Joi.object({
  text:      Joi.string().max(500).required(),
  color:     Joi.string().optional().allow('', null),
  font_id:   Joi.number().optional().allow(null),
  font_size: Joi.number().optional().allow(null),
  shadow:    Joi.any().optional(),
  x:         Joi.number().optional().allow(null),
  y:         Joi.number().optional().allow(null),
}).unknown(true);

const textLayerArray = Joi.array().items(textLayer);

const textLayerValidateOpts = { convert: true, stripUnknown: true };

const textLayersField = Joi.alternatives()
  .try(
    textLayerArray,
    Joi.string().custom((value, helpers) => {
      try {
        const parsed = JSON.parse(value);
        const { error, value: validated } = textLayerArray.validate(parsed, textLayerValidateOpts);
        if (error) return helpers.error('any.invalid');
        return validated;
      } catch (_) {
        return helpers.error('any.invalid');
      }
    }, 'text_layers JSON parser')
  )
  .messages({ 'any.invalid': 'text_layers must be a valid JSON array' });

/** 3D Signage: each entry contributes height×width (in its own unit) to total area. */
const dimensionEntry = Joi.object({
  text:   Joi.string().max(500).optional().allow('', null),
  height: Joi.number().min(0).required(),
  width:  Joi.number().min(0).required(),
  unit:   Joi.number().integer().positive().optional().allow(null),
}).unknown(true);

const dimensionArray = Joi.array().items(dimensionEntry).max(100);

const dimensionArrayField = Joi.alternatives()
  .try(
    dimensionArray,
    Joi.string().custom((value, helpers) => {
      try {
        const parsed = JSON.parse(value);
        const { error, value: validated } = dimensionArray.validate(parsed, { convert: true, stripUnknown: false });
        if (error) return helpers.error('any.invalid');
        return validated;
      } catch (_) {
        return helpers.error('any.invalid');
      }
    }, 'dimension JSON parser')
  )
  .messages({ 'any.invalid': 'must be a valid JSON array of height/width/unit entries' });

const urlArray = Joi.array().items(Joi.string().max(2000)).max(50);

const pylonTilesImagesField = Joi.alternatives()
  .try(
    urlArray,
    Joi.string().custom((value, helpers) => {
      try {
        const parsed = JSON.parse(value);
        const { error, value: validated } = urlArray.validate(parsed);
        if (error) return helpers.error('any.invalid');
        return validated;
      } catch (_) {
        return helpers.error('any.invalid');
      }
    }, 'pylon_tiles_images JSON parser')
  )
  .messages({ 'any.invalid': 'pylon_tiles_images must be a valid JSON array of image URLs' });

const addToCart = Joi.object({
  product_type_id:   Joi.number().integer().positive().required(),
  material_id:       Joi.number().integer().positive().optional().allow(null),
  material_style_id: Joi.number().integer().positive().optional().allow(null),
  frame_id:          Joi.number().integer().positive().optional().allow(null),
  wallpaper_id:      Joi.number().integer().positive().optional().allow(null),
  add_border_id:     Joi.number().integer().positive().optional().allow(null),
  border_is_lit:     Joi.boolean().truthy('true', '1', 1).falsy('false', '0', 0, '').optional(),
  lollipop_element_id: Joi.number().integer().positive().optional().allow(null),
  pylon_id:            Joi.number().integer().positive().optional().allow(null),
  pylon_category_id:   Joi.number().integer().positive().optional().allow(null),
  tiles:               Joi.number().integer().min(0).max(1000).optional(),
  pylon_tiles_images:  pylonTilesImagesField.optional().allow(null),
  base_id:           Joi.number().integer().positive().optional().allow(null),
  thickness_id:      Joi.number().integer().positive().optional().allow(null),
  element_id:        Joi.number().integer().positive().optional().allow(null),
  color_id:          Joi.number().integer().positive().optional().allow(null),
  font_id:           Joi.number().integer().positive().optional().allow(null),
  illumination_option_id: Joi.number().integer().positive().optional().allow(null),
  text_layers:       textLayersField.optional(),
  text_dimension:    dimensionArrayField.optional().allow(null),
  logo_dimension:    dimensionArrayField.optional().allow(null),
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
