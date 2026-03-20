const Joi = require('joi');

const create = Joi.object({
  name:       Joi.string().min(2).max(150).required(),
  base_price: Joi.number().min(0).required(),
  is_active:  Joi.boolean().optional(),
});

const update = create.fork(['name','base_price'], (schema) => schema.optional());

module.exports = { create, update };
