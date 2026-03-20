const router    = require('express').Router();
const auth      = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');

router.use(auth, roleCheck('vendor', 'super_admin'));

router.use('/profile',   require('./profile'));
router.use('/pricing',   require('./pricing'));
router.use('/orders',    require('./orders'));
router.use('/dashboard', require('./dashboard'));

module.exports = router;
