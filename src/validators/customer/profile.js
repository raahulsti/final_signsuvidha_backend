const Joi = require('joi');

const update = Joi.object({
  name:   Joi.string().min(2).max(150).optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  date_of_birth: Joi.date().iso().max('now').optional().allow(null, '')
    .messages({ 'date.max': 'Date of birth cannot be in the future' }),
  profile_image_url: Joi.string().max(500).optional(),
  phone:  Joi.forbidden().messages({ 'any.unknown': 'Phone number cannot be changed' }),
  email:  Joi.forbidden().messages({ 'any.unknown': 'Email cannot be changed via profile' }),
}).or('name', 'gender', 'date_of_birth', 'profile_image_url')
  .messages({ 'object.missing': 'Provide at least one field or profile image to update' });

module.exports = { update };
