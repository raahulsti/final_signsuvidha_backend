const Joi = require('joi');

const create = Joi.object({
  state_id: Joi.number().integer().positive().required(),
  name: Joi.string().min(2).max(150).required(),
  sort_order: Joi.number().integer().min(0).optional(),
  is_active: Joi.boolean().optional(),
});

const update = create.fork(['state_id', 'name'], (schema) => schema.optional());

module.exports = { create, update };
