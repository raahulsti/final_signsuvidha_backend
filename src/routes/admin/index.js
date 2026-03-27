const router    = require('express').Router();
const auth      = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');

router.use(auth, roleCheck('super_admin'));

router.use('/dashboard',        require('./dashboard'));
router.use('/product-types',    require('./productTypes'));
router.use('/materials',        require('./materials'));
router.use('/elements',         require('./elements'));
router.use('/colors',           require('./colors'));
router.use('/shadow-colors',    require('./shadowColors'));
router.use('/border-colors',    require('./borderColors'));
router.use('/base-colors',      require('./baseColors'));
router.use('/fonts',            require('./fonts'));
router.use('/font-sizes',       require('./fontSizes'));
router.use('/letter-styles',    require('./letterStyles'));
router.use('/dimension-units',  require('./dimensionUnits'));
router.use('/shipping-services',require('./shippingServices'));
router.use('/listed-products',  require('./listedProducts'));
router.use('/vendors',          require('./vendors'));
router.use('/orders',           require('./orders'));

module.exports = router;
