const router    = require('express').Router();
const auth      = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');

router.use(auth, roleCheck('customer', 'vendor', 'super_admin'));

router.use('/addresses', require('./addresses'));
router.use('/cart',      require('./cart'));
router.use('/orders',    require('./orders'));

module.exports = router;
