const Joi = require('joi');
const { WALLPAPER_TYPES } = require('../../utils/constants');

const create = Joi.object({
  product_type_id:      Joi.number().integer().positive().required(),
  name:                 Joi.string().min(2).max(150).required(),
  description:          Joi.string().max(1000).optional().allow(''),
  wallpaper_type:       Joi.string().valid(...WALLPAPER_TYPES).required(),
  admin_price_per_sqft: Joi.number().min(0).required(),
  sort_order:           Joi.number().integer().min(0).optional(),
  is_active:            Joi.boolean().optional(),
});

const update = create.fork(
  ['product_type_id', 'name', 'wallpaper_type', 'admin_price_per_sqft'],
  (schema) => schema.optional()
);

module.exports = { create, update };
