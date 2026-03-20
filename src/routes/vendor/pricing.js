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

// Letter style pricing
router.put('/letter-styles/:letterStyleId',     validate(v.letterStylePrice), ctrl.upsertLetterStylePrice);

module.exports = router;
