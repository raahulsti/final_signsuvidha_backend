const { validationError } = require('../utils/response');

// validate(schema) — validates req.body against Joi schema
const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly:    false,
    stripUnknown:  true,
  });
  if (error) {
    const errors = error.details.map((d) => ({
      field:   d.path.join('.'),
      message: d.message.replace(/['"]/g, ''),
    }));
    return validationError(res, errors);
  }
  req[property] = value;
  next();
};

module.exports = validate;
