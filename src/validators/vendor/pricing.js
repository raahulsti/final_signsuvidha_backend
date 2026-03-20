const Joi = require('joi');

const materialPrice = Joi.object({
  price_per_sqft: Joi.number().min(0).required(),
});

const elementPrice = Joi.object({
  price_extra: Joi.number().min(0).required(),
});

const colorPrice = Joi.object({
  price_extra: Joi.number().min(0).required(),
});

const letterStylePrice = Joi.object({
  price_multiplier: Joi.number().min(0.1).max(10).optional(),
  price_extra:      Joi.number().min(0).optional(),
});

module.exports = { materialPrice, elementPrice, colorPrice, letterStylePrice };
