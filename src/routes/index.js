const router = require('express').Router();
const { defaultLimiter } = require('../middleware/rateLimiter');

router.use(defaultLimiter);

router.use('/auth',     require('./auth'));
router.use('/admin',    require('./admin'));
router.use('/vendor',   require('./vendor'));
router.use('/customer', require('./customer'));
router.use('/common',   require('./common'));

module.exports = router;
