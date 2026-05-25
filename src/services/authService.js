const bcrypt     = require('bcryptjs');
const moment     = require('moment');
const userModel   = require('../models/userModel');
const vendorModel = require('../models/vendorModel');
const authModel   = require('../models/authModel');
const { generateAccessToken, generateRefreshToken } = require('../config/jwt');
const { generateOTP } = require('../utils/helpers');

const register = async ({ name, email, phone, gender, date_of_birth, profile_image_url, password, role, purpose }) => {
  if (purpose !== 'register') {
    const err = new Error('Invalid purpose for registration'); err.statusCode = 400; throw err;
  }
  const existingByPhone = await userModel.findByPhone(phone);
  if (existingByPhone) {
    const roles = await userModel.getRoles(existingByPhone.id);
    const isCustomer = roles.some((r) => r.name === 'customer');
    if (isCustomer && !existingByPhone.is_active) {
      const otp = await sendOtp({
        userId: existingByPhone.id,
        contact: phone,
        contactType: 'phone',
        purpose: 'register',
      });
      return { userId: existingByPhone.id, otp, pendingVerification: true };
    }
    const err = new Error('Phone already registered'); err.statusCode = 400; throw err;
  }
  const existingByEmail = await userModel.findByEmail(email);
  if (existingByEmail) {
    const err = new Error('Email already registered'); err.statusCode = 400; throw err;
  }

  if (role !== 'customer' && !password) {
    const err = new Error('Password is required for this role'); err.statusCode = 400; throw err;
  }
  const userId = await userModel.create({
    name,
    email,
    phone,
    gender,
    date_of_birth: date_of_birth || null,
    profile_image_url: profile_image_url || null,
    password,
    is_active: role === 'customer' ? 0 : 1,
  });
  await userModel.addRole(userId, role);

  // If vendor registration, create vendor profile placeholder
  if (role === 'vendor') {
    const db = require('../config/db');
    await db.execute('INSERT INTO vendors (user_id, business_name) VALUES (?, ?)', [userId, name]);
  }

  // Customer onboarding: send OTP after creating inactive account.
  let otp = null;
  if (role === 'customer') {
    otp = await sendOtp({ userId, contact: phone, contactType: 'phone', purpose: 'register' });
  }

  return { userId, otp };
};

const login = async ({ email, password, deviceInfo }) => {
  const user = await userModel.findByEmail(email);

  if (!user || !user.is_active) {
    const err = new Error('Invalid Username or Password'); err.statusCode = 401; throw err;
  }

  const storedHash = user.password_hash ?? user.password;
  try {
    if (!storedHash || !bcrypt.compareSync(password, storedHash)) {
      const err = new Error('Invalid credentials'); 
      err.statusCode = 401; throw err;
    }
  } catch (err) {
    if (err.statusCode === 401) throw err;
    const e = new Error('Invalid credentials'); e.statusCode = 401; throw e;
  }
  
  const roles   = await userModel.getRoles(user.id);
  const roleArr = roles.map((r) => r.name);

  const isVendorOnly = roleArr.includes('vendor') && !roleArr.includes('super_admin');
  if (isVendorOnly) {
    const vendor = await vendorModel.getByUserId(user.id);
    if (!vendor) {
      const err = new Error('profile not found'); err.statusCode = 403; throw err;
    }
    if (!vendor.is_approved) {
      const err = new Error('Your account is pending admin approval. Please login after approval.');
      err.statusCode = 403;
      throw err;
    }
    if (!vendor.is_active) {
      const err = new Error('Your account has been deactivated. Contact support.');
      err.statusCode = 403;
      throw err;
    }
  }

  const payload      = { user_id: user.id, roles: roleArr };
  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  const expiresAt    = moment().add(7, 'days').toDate();

  await authModel.saveToken(user.id, accessToken, deviceInfo, expiresAt);

  return {
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, gender: user.gender, roles: roleArr },
    accessToken,
    refreshToken,
  };
};

const sendOtp = async ({ userId, contact, contactType, purpose }) => {
  // const otp = generateOTP(6);
  const otp = "123456";
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
