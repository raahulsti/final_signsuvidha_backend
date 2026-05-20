const router = require('express').Router();
router.use('/masters', require('./masters'));
router.use('/pages',   require('./pages'));
const listedProducts = require('./listedProducts');
router.use('/listed-products', listedProducts);
router.use('/listed-product', listedProducts); // alias (singular)
module.exports = router;
