const logger = require('../utils/logger');
const { MulterError } = require('multer');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(`${err.message}\n${err.stack}`);

  if (err instanceof MulterError) {
    const hint = err.code === 'LIMIT_UNEXPECTED_FILE'
      ? `File field "${err.field}" is not allowed. Use "image" or "preview_image" for uploads.`
      : err.message;
    return res.status(200).json({ success: false, message: hint, error_code: 400 });
  }

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(200).json({ success: false, message: 'Duplicate entry. Record already exists.', error_code: 400 });
  }
  // MySQL FK constraint
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(200).json({ success: false, message: 'Invalid reference. Related record not found.', error_code: 400 });
  }
  // MySQL cannot delete parent row
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(200).json({ success: false, message: 'Cannot delete. Record is referenced by other data.', error_code: 400 });
  }

  const statusCode = err.statusCode || 500;
  return res.status(200).json({
    success: false,
    message: err.message || 'Internal server error',
    error_code: statusCode,
  });
};

module.exports = errorHandler;
