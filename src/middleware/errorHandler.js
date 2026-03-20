const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(`${err.message}\n${err.stack}`);

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({ success: false, message: 'Duplicate entry. Record already exists.' });
  }
  // MySQL FK constraint
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ success: false, message: 'Invalid reference. Related record not found.' });
  }
  // MySQL cannot delete parent row
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(400).json({ success: false, message: 'Cannot delete. Record is referenced by other data.' });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
