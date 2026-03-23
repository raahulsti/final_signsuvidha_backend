const { success, created, error } = require('../utils/response');
const { generateAccessToken, generateRefreshToken } = require('../config/jwt');
const moment    = require('moment');
const authService = require('../services/authService');
const authModel   = require('../models/authModel');
const userModel   = require('../models/userModel');
const db          = require('../config/db');

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

    // OTP verify from db here
    await authService.verifyOtp({ contact, contactType, otp_code, purpose });

    // ── LOGIN OR REGISTER → Generate Token ────────────────────────
    if (purpose === 'login' || purpose === 'register') {
      // User find by phone or email
      const user = email
        ? await userModel.findByEmail(email)
        : await userModel.findByPhone(phone);

      if (!user) {
        const err = new Error('User not found'); err.statusCode = 404; throw err;
      }
      if (!user.is_active) {
        const err = new Error('Account is inactive'); err.statusCode = 403; throw err;
      }

      const roles   = await userModel.getRoles(user.id);
      const roleArr = roles.map((r) => r.name);

      const payload      = { user_id: user.id, roles: roleArr };
      const accessToken  = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);
      const expiresAt    = moment().add(7, 'days').toDate();

      await authModel.saveToken(user.id, accessToken, req.headers['user-agent'], expiresAt);

      return success(res, {
        user: {
          id:    user.id,
          name:  user.name,
          email: user.email,
          phone: user.phone,
          roles: roleArr,
        },
        accessToken,
        refreshToken,
      }, 'OTP verified. Login successful');
    }

    // ── FORGOT PASSWORD → Generate Reset Token (short lived) ──────
    if (purpose === 'forgot_password') {
      // User find by phone or email
      const user = email
        ? await userModel.findByEmail(email)
        : await userModel.findByPhone(phone);

      if (!user) {
        const err = new Error('User not found'); err.statusCode = 404; throw err;
      }

      // Short lived reset token — valid for 15 minutes, only for reset
      const resetToken = generateAccessToken({ user_id: user.id, purpose: 'reset_password' });

      // Save in DB for 15 minutes
      const expiresAt = moment().add(15, 'minutes').toDate();
      await authModel.saveToken(user.id, resetToken, 'password_reset', expiresAt);

      return success(res, {
        reset_token: resetToken,
      }, 'OTP verified. Use reset_token to set new password');
    }

    // ── Other purposes ─────────────────────────────────────
    return success(res, {}, 'OTP verified successfully');

  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { reset_token, new_password } = req.body;

    // Verify reset token
    const { verifyAccessToken } = require('../config/jwt');
    let decoded;
    try {
      decoded = verifyAccessToken(reset_token);
    } catch (e) {
      const err = new Error('Reset token expired or invalid'); err.statusCode = 400; throw err;
    }

    // Purpose check — only reset_password token accepted
    if (decoded.purpose !== 'reset_password') {
      const err = new Error('Invalid reset token'); err.statusCode = 400; throw err;
    }

    // Check if token is valid in DB
    const dbToken = await db.findOne(
      'SELECT id FROM auth_tokens WHERE user_id = ? AND token = ? AND expires_at > NOW()',
      [decoded.user_id, reset_token]
    );
    if (!dbToken) {
      const err = new Error('Reset token expired or already used'); err.statusCode = 400; throw err;
    }

    // Update password
    const bcrypt = require('bcryptjs');
    const hash   = bcrypt.hashSync(new_password, 12);
    await db.execute(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [hash, decoded.user_id]
    );

    // Delete reset token — only one time use
    await authModel.revokeToken(decoded.user_id, reset_token);

    return success(res, {}, 'Password reset successfully. Please login again.');
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
