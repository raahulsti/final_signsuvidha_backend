const router = require('express').Router();
// const { defaultLimiter } = require('../middleware/rateLimiter');

// TODO: re-enable global rate limiting when ready (prevents "Too many requests")
// router.use(defaultLimiter);

router.use('/auth',     require('./auth'));
router.use('/admin',    require('./admin'));
router.use('/vendor',   require('./vendor'));
router.use('/customer', require('./customer'));
router.use('/common',   require('./common'));

module.exports = router;
