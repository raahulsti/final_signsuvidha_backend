const Joi = require('joi');

const create = Joi.object({
  size_value: Joi.number().integer().min(1).max(500).required(),
  label:      Joi.string().max(50).optional().allow(''),
  is_active:  Joi.boolean().optional(),
});

const update = create.fork(['size_value'], (schema) => schema.optional());

module.exports = { create, update };
