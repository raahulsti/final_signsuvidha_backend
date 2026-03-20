const Joi = require('joi');

const register = Joi.object({
  name:     Joi.string().min(2).max(150).required(),
  email:    Joi.string().email().required(),
  phone:    Joi.string().pattern(/^[6-9]\d{9}$/).required()
              .messages({ 'string.pattern.base': 'Enter a valid 10-digit Indian mobile number' }),
  password: Joi.string().min(8).required()
              .messages({ 'string.min': 'Password must be at least 8 characters' }),
  role:     Joi.string().valid('vendor', 'customer').required(),
});

const login = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

const otpSend = Joi.object({
  email:   Joi.string().email().optional(),
  phone:   Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
  purpose: Joi.string().valid('login','register','forgot_password').required(),
}).or('email', 'phone');

const otpVerify = Joi.object({
  email:    Joi.string().email().optional(),
  phone:    Joi.string().optional(),
  otp_code: Joi.string().length(6).required(),
  purpose:  Joi.string().valid('login','register','forgot_password').required(),
}).or('email', 'phone');

module.exports = { register, login, otpSend, otpVerify };
