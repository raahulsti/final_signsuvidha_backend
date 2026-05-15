const Joi = require('joi');

const materialPrice = Joi.object({
  price_per_sqft: Joi.number().min(0).required(),
});

const basePrice = Joi.object({
  price_per_sqft: Joi.number().min(0).required(),
});

const thicknessPrice = Joi.object({
  price_per_sqft: Joi.number().min(0).required(),
});

const elementPrice = Joi.object({
  price_extra: Joi.number().min(0).required(),
});

const colorPrice = Joi.object({
  price_extra: Joi.number().min(0).required(),
});

const fontPrice = Joi.object({
  product_type_id: Joi.number().integer().positive().required(),
  price_extra: Joi.number().min(0).required(),
});

const illuminationPrice = Joi.object({
  price_per_sqft: Joi.number().min(0).required(),
});

const materialStylePrice = Joi.object({
  price_per_sqft: Joi.number().min(0).required(),
});

const framePrice = Joi.object({
  price_per_sqft: Joi.number().min(0).required(),
});

const wallpaperPrice = Joi.object({
  price_per_sqft: Joi.number().min(0).required(),
});

module.exports = { materialPrice, basePrice, thicknessPrice, elementPrice, colorPrice, fontPrice, illuminationPrice, materialStylePrice, framePrice, wallpaperPrice };
