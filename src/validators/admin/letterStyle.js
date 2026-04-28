const Joi = require('joi');

const create = Joi.object({
  name:              Joi.string().min(2).max(100).required(),
  is_active:         Joi.boolean().optional(),
});

const update = create.fork(
  ['name'],
  (schema) => schema.optional()
);

module.exports = { create, update };
