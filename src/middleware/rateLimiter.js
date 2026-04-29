const rateLimit = require('express-rate-limit');

const defaultLimiter = rateLimit({
  windowMs:        parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 2 * 60 * 1000,
  max:             parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max:      5,
  message:  { success: false, message: 'Too many auth attempts. Please wait 2 minutes.' },
});

module.exports = { defaultLimiter, authLimiter };
