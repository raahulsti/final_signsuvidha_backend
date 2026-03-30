const router = require('express').Router();
const ctrl   = require('../../controllers/common/mastersController');

router.get('/product-types',      ctrl.getProductTypes);
router.get('/materials',          ctrl.getMaterials);
router.get('/elements',           ctrl.getElements);
router.get('/images',             ctrl.getImages);
router.get('/colors',             ctrl.getColors);
router.get('/shadow-colors',      ctrl.getShadowColors);
router.get('/border-colors',      ctrl.getBorderColors);
router.get('/base-colors',        ctrl.getBaseColors);
router.get('/fonts',              ctrl.getFonts);
router.get('/font-sizes',         ctrl.getFontSizes);
router.get('/letter-styles',      ctrl.getLetterStyles);
router.get('/dimension-units',    ctrl.getDimensionUnits);
router.get('/shipping-services',  ctrl.getShippingServices);
router.get('/listed-products',    ctrl.getListedProducts);

module.exports = router;
