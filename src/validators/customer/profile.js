const Joi = require('joi');

const update = Joi.object({
  name:   Joi.string().min(2).max(150).optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  phone:  Joi.forbidden().messages({ 'any.unknown': 'Phone number cannot be changed' }),
  email:  Joi.forbidden().messages({ 'any.unknown': 'Email cannot be changed via profile' }),
}).min(1).messages({ 'object.min': 'Provide at least name or gender to update' });

module.exports = { update };
