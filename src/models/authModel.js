const db     = require('../config/db');
const moment = require('moment');

const saveToken = (userId, token, deviceInfo, expiresAt) =>
  db.execute(
    'INSERT INTO auth_tokens (user_id, token, device_info, expires_at) VALUES (?, ?, ?, ?)',
    [userId, token, deviceInfo || null, expiresAt]
  );

const revokeToken = (userId, token) =>
  db.execute(
    'DELETE FROM auth_tokens WHERE user_id = ? AND token = ?',
    [userId, token]
  );

const revokeAllTokens = (userId) =>
  db.execute('DELETE FROM auth_tokens WHERE user_id = ?', [userId]);

const saveOtp = (userId, contact, contactType, otpCode, purpose) => {
  const expiresAt = moment().add(parseInt(process.env.OTP_EXPIRES_MINUTES) || 10, 'minutes').toDate();
  const email     = contactType === 'email' ? contact : null;
  const phone     = contactType === 'phone' ? contact : null;
  return db.execute(
    'INSERT INTO otp_verifications (user_id, email, phone, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
    [userId || null, email, phone, otpCode, purpose, expiresAt]
  );
};

const findValidOtp = (contact, contactType, otpCode, purpose) => {
  const field = contactType === 'email' ? 'email' : 'phone';
  return db.findOne(
    `SELECT * FROM otp_verifications
     WHERE ${field} = ? AND otp_code = ? AND purpose = ?
       AND is_used = 0 AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [contact, otpCode, purpose]
  );
};

const markOtpUsed = (id) =>
  db.execute('UPDATE otp_verifications SET is_used = 1 WHERE id = ?', [id]);

module.exports = { saveToken, revokeToken, revokeAllTokens, saveOtp, findValidOtp, markOtpUsed };
