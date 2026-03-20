const bcrypt     = require('bcryptjs');
const moment     = require('moment');
const userModel  = require('../models/userModel');
const authModel  = require('../models/authModel');
const { generateAccessToken, generateRefreshToken } = require('../config/jwt');
const { generateOTP } = require('../utils/helpers');

const register = async ({ name, email, phone, password, role }) => {
  const existing = await userModel.findByEmail(email);
  if (existing) {
    const err = new Error('Email already registered'); err.statusCode = 400; throw err;
  }
  const userId = await userModel.create({ name, email, phone, password });
  await userModel.addRole(userId, role);

  // If vendor registration, create vendor profile placeholder
  if (role === 'vendor') {
    const db = require('../config/db');
    await db.execute('INSERT INTO vendors (user_id, business_name) VALUES (?, ?)', [userId, name]);
  }
  return userId;
};

const login = async ({ email, password, deviceInfo }) => {
  const user = await userModel.findByEmail(email);
  if (!user || !user.is_active) {
    const err = new Error('Invalid credentials'); err.statusCode = 401; throw err;
  }
  if (!bcrypt.compareSync(password, user.password_hash)) {
    const err = new Error('Invalid credentials'); err.statusCode = 401; throw err;
  }

  const roles   = await userModel.getRoles(user.id);
  const roleArr = roles.map((r) => r.name);

  const payload      = { user_id: user.id, roles: roleArr };
  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  const expiresAt    = moment().add(7, 'days').toDate();

  await authModel.saveToken(user.id, accessToken, deviceInfo, expiresAt);

  return {
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, roles: roleArr },
    accessToken,
    refreshToken,
  };
};

const sendOtp = async ({ userId, contact, contactType, purpose }) => {
  const otp = generateOTP(6);
  await authModel.saveOtp(userId, contact, contactType, otp, purpose);
  // TODO: integrate SMS (Fast2SMS / MSG91) or email (nodemailer)
  if (process.env.NODE_ENV === 'development') return otp;
  return null;
};

const verifyOtp = async ({ contact, contactType, otp_code, purpose }) => {
  const record = await authModel.findValidOtp(contact, contactType, otp_code, purpose);
  if (!record) { const err = new Error('Invalid or expired OTP'); err.statusCode = 400; throw err; }
  await authModel.markOtpUsed(record.id);
  return true;
};

module.exports = { register, login, sendOtp, verifyOtp };
