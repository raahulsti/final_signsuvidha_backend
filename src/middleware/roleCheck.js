const { forbidden } = require('../utils/response');

// Usage: roleCheck('super_admin')  or  roleCheck('vendor', 'super_admin')
const roleCheck = (...allowedRoles) => (req, res, next) => {
  const allowed = allowedRoles.flat();
  const hasRole = req.user?.roles?.some((r) => allowed.includes(r));
  if (!hasRole) return forbidden(res, 'You do not have permission to access this resource');
  next();
};

module.exports = roleCheck;
