const Joi = require('joi');

const create = Joi.object({
  name: Joi.string().min(2).max(150).required(),
  code: Joi.string().min(2).max(10).required(),
  sort_order: Joi.number().integer().min(0).optional(),
  is_active: Joi.boolean().optional(),
});

const update = create.fork(['name', 'code'], (schema) => schema.optional());

module.exports = { create, update };
