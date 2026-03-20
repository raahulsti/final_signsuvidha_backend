const Joi = require('joi');

const create = Joi.object({
  address_title: Joi.string().max(100).optional().allow(''),
  full_name:     Joi.string().min(2).max(150).required(),
  phone:         Joi.string().pattern(/^[6-9]\d{9}$/).required()
                   .messages({ 'string.pattern.base': 'Enter valid 10-digit mobile number' }),
  email:         Joi.string().email().optional().allow(''),
  address_line1: Joi.string().min(5).max(255).required(),
  address_line2: Joi.string().max(255).optional().allow(''),
  city:          Joi.string().min(2).max(100).required(),
  state:         Joi.string().min(2).max(100).required(),
  pincode:       Joi.string().pattern(/^\d{6}$/).required()
                   .messages({ 'string.pattern.base': 'Enter valid 6-digit pincode' }),
  country:       Joi.string().max(100).optional(),
  is_default:    Joi.boolean().optional(),
  billing_type:  Joi.string().valid('personal','commercial').optional(),
});

const update = create.fork(
  ['full_name','phone','address_line1','city','state','pincode'],
  (schema) => schema.optional()
);

module.exports = { create, update };
