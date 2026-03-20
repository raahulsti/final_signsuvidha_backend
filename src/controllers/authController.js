const { success, created, error } = require('../utils/response');
const authService = require('../services/authService');
const authModel   = require('../models/authModel');

exports.register = async (req, res, next) => {
  try {
    const userId = await authService.register(req.body);
    return created(res, { user_id: userId }, 'Registration successful');
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const data = await authService.login({ ...req.body, deviceInfo: req.headers['user-agent'] });
    return success(res, data, 'Login successful');
  } catch (err) { next(err); }
};

exports.sendOtp = async (req, res, next) => {
  try {
    const { email, phone, purpose } = req.body;
    const contactType = email ? 'email' : 'phone';
    const contact     = email || phone;
    const otp = await authService.sendOtp({ contact, contactType, purpose });
    const resp = process.env.NODE_ENV === 'development' ? { otp } : {};
    return success(res, resp, 'OTP sent successfully');
  } catch (err) { next(err); }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, phone, otp_code, purpose } = req.body;
    const contactType = email ? 'email' : 'phone';
    const contact     = email || phone;
    await authService.verifyOtp({ contact, contactType, otp_code, purpose });
    return success(res, {}, 'OTP verified successfully');
  } catch (err) { next(err); }
};

exports.logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    await authModel.revokeToken(req.user.id, token);
    return success(res, {}, 'Logged out successfully');
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    return success(res, { ...req.user });
  } catch (err) { next(err); }
};
