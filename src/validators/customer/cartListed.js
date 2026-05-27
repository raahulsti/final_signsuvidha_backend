const Joi = require('joi');
const { LISTED_PRODUCT_SIZES } = require('../../utils/constants');

const addListed = Joi.object({
  listed_product_id: Joi.number().integer().positive().required(),
  size: Joi.string().valid(...LISTED_PRODUCT_SIZES).required(),
  quantity: Joi.number().integer().min(1).max(100).optional().default(1),
  color_id: Joi.number().integer().positive().optional().allow(null),
});

module.exports = { addListed };
