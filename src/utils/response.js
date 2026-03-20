const success = (res, data = {}, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const created = (res, data = {}, message = 'Created successfully') =>
  res.status(201).json({ success: true, message, data });

const paginated = (res, data, pagination, message = 'Success') =>
  res.status(200).json({ success: true, message, data, pagination });

const error = (res, message = 'Something went wrong', statusCode = 500) =>
  res.status(statusCode).json({ success: false, message });

const notFound = (res, message = 'Resource not found') =>
  res.status(404).json({ success: false, message });

const unauthorized = (res, message = 'Unauthorized') =>
  res.status(401).json({ success: false, message });

const forbidden = (res, message = 'Forbidden') =>
  res.status(403).json({ success: false, message });

const validationError = (res, errors) =>
  res.status(422).json({ success: false, message: 'Validation failed', errors });

module.exports = {
  success, created, paginated, error,
  notFound, unauthorized, forbidden, validationError,
};
