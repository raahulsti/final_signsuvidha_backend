const Joi = require('joi');
const { LISTED_PRODUCT_SIZES } = require('../../utils/constants');

const sizePrice = Joi.number().min(0).optional();
const sizeDim = Joi.string().max(150).optional().allow('', null);

const create = Joi.object({
  product_type_id: Joi.number().integer().positive().required(),
  name:            Joi.string().min(2).max(200).required(),
  description:     Joi.string().max(2000).optional().allow(''),
  is_best_seller:  Joi.boolean().truthy('true', '1', 1).falsy('false', '0', 0, '').optional(),
  sort_order:      Joi.number().integer().min(0).optional(),
  is_active:       Joi.boolean().truthy('true', '1', 1).falsy('false', '0', 0, '').optional(),
  price_regular:   sizePrice,
  price_medium:    sizePrice,
  price_large:     sizePrice,
  height_regular:  sizeDim,
  height_medium:   sizeDim,
  height_large:    sizeDim,
  width_regular:   sizeDim,
  width_medium:    sizeDim,
  width_large:     sizeDim,
  remove_image_ids: Joi.alternatives().try(
    Joi.array().items(Joi.number().integer().positive()),
    Joi.string()
  ).optional(),
}).custom((value, helpers) => {
  const hasPrice = LISTED_PRODUCT_SIZES.some((s) => value[`price_${s}`] !== undefined && value[`price_${s}`] !== '');
  if (!hasPrice) return helpers.error('any.custom', { message: 'At least one size price is required (any of regular, medium, large)' });
  return value;
}, 'size prices');

const update = Joi.object({
  product_type_id: Joi.number().integer().positive().optional(),
  name:            Joi.string().min(2).max(200).optional(),
  description:     Joi.string().max(2000).optional().allow(''),
  is_best_seller:  Joi.boolean().truthy('true', '1', 1).falsy('false', '0', 0, '').optional(),
  sort_order:      Joi.number().integer().min(0).optional(),
  is_active:       Joi.boolean().truthy('true', '1', 1).falsy('false', '0', 0, '').optional(),
  price_regular:   sizePrice,
  price_medium:    sizePrice,
  price_large:     sizePrice,
  height_regular:  sizeDim,
  height_medium:   sizeDim,
  height_large:    sizeDim,
  width_regular:   sizeDim,
  width_medium:    sizeDim,
  width_large:     sizeDim,
  remove_image_ids: Joi.alternatives().try(
    Joi.array().items(Joi.number().integer().positive()),
    Joi.string()
  ).optional(),
});

module.exports = { create, update, LISTED_PRODUCT_SIZES };
