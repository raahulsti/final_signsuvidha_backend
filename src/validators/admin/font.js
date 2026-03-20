const Joi = require('joi');

const create = Joi.object({
  name:             Joi.string().min(2).max(100).required(),
  sort_order:       Joi.number().integer().min(0).optional(),
  product_type_ids: Joi.array().items(Joi.number().integer().positive()).optional(),
});

const update = create.fork(['name'], (schema) => schema.optional());

module.exports = { create, update };
