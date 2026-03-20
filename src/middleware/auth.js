const { verifyAccessToken } = require('../config/jwt');
const { unauthorized }      = require('../utils/response');
const { findOne, execute }  = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
      return unauthorized(res, 'No token provided');

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') return unauthorized(res, 'Token expired');
      return unauthorized(res, 'Invalid token');
    }

    // Check token not revoked
    const dbToken = await findOne(
      'SELECT id FROM auth_tokens WHERE user_id = ? AND token = ? AND expires_at > NOW()',
      [decoded.user_id, token]
    );
    if (!dbToken) return unauthorized(res, 'Token revoked or invalid');

    // Get user
    const user = await findOne(
      'SELECT id, name, email, phone, is_active FROM users WHERE id = ?',
      [decoded.user_id]
    );
    if (!user || !user.is_active) return unauthorized(res, 'Account not found or inactive');

    // Get roles
    const roles = await execute(
      `SELECT r.name FROM roles r
       INNER JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = ?`,
      [decoded.user_id]
    );

    req.user       = user;
    req.user.roles = roles.map((r) => r.name);
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authenticate;
