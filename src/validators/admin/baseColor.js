const Joi = require('joi');

const create = Joi.object({
  name:              Joi.string().max(100).optional().allow(''),
  hex_code:          Joi.string()
                       .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
                       .required()
                       .messages({ 'string.pattern.base': 'Invalid hex color. Use format #RRGGBB' }),
  admin_price_extra: Joi.number().min(0).optional(),
  product_type_ids:  Joi.array().items(Joi.number().integer().positive()).optional(),
});

const update = create.fork(['hex_code'], (schema) => schema.optional());

module.exports = { create, update };
