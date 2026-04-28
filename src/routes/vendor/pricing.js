const router   = require('express').Router();
const ctrl     = require('../../controllers/vendor/pricingController');
const validate = require('../../middleware/validate');
const v        = require('../../validators/vendor/pricing');

// Material pricing
router.get('/materials',                        ctrl.getAllMaterialPrices);
router.put('/materials/:materialId',            validate(v.materialPrice),    ctrl.upsertMaterialPrice);

// Element pricing
router.get('/elements',                         ctrl.getAllElementPrices);
router.put('/elements/:elementId',              validate(v.elementPrice),     ctrl.upsertElementPrice);

// Color pricing
router.put('/colors/:colorId',                  validate(v.colorPrice),       ctrl.upsertColorPrice);

// Font pricing (product-type based)
router.get('/fonts',                             ctrl.getAllFontPrices);
router.put('/fonts/:fontId',                     validate(v.fontPrice),        ctrl.upsertFontPrice);

// Illumination (lit / non-lit) pricing
router.get('/illumination',                      ctrl.getAllIlluminationPrices);
router.put('/illumination/:illuminationOptionId', validate(v.illuminationPrice), ctrl.upsertIlluminationPrice);

module.exports = router;
