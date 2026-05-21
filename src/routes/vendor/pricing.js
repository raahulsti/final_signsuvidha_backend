const router   = require('express').Router();
const ctrl     = require('../../controllers/vendor/pricingController');
const validate = require('../../middleware/validate');
const v        = require('../../validators/vendor/pricing');

// Material pricing
router.get('/materials',                        ctrl.getAllMaterialPrices);
router.put('/materials/:materialId',            validate(v.materialPrice),    ctrl.upsertMaterialPrice);

router.get('/material-styles',                  ctrl.getAllMaterialStylePrices);
router.put('/material-styles/:materialStyleId', validate(v.materialStylePrice), ctrl.upsertMaterialStylePrice);

router.get('/frames',                           ctrl.getAllFramePrices);
router.put('/frames/:frameId',                  validate(v.framePrice),        ctrl.upsertFramePrice);

router.get('/wallpapers',                       ctrl.getAllWallpaperPrices);
router.put('/wallpapers/:wallpaperId',          validate(v.wallpaperPrice),    ctrl.upsertWallpaperPrice);

router.get('/add-borders',                      ctrl.getAllAddBorderPrices);
router.put('/add-borders/:addBorderId',         validate(v.addBorderPrice),    ctrl.upsertAddBorderPrice);

router.get('/lollipop-elements',                ctrl.getAllLollipopElementPrices);
router.put('/lollipop-elements/:lollipopElementId', validate(v.lollipopElementPrice), ctrl.upsertLollipopElementPrice);

router.get('/pylon-categories',                       ctrl.getAllPylonCategoryPrices);
router.put('/pylon-categories/:pylonCategoryId',    validate(v.pylonCategoryPrice), ctrl.upsertPylonCategoryPrice);

// Base pricing (physical base, per sq ft)
router.get('/bases',                            ctrl.getAllBasePrices);
router.put('/bases/:baseId',                    validate(v.basePrice),         ctrl.upsertBasePrice);

// Thickness pricing (per sq ft)
router.get('/thicknesses',                      ctrl.getAllThicknessPrices);
router.put('/thicknesses/:thicknessId',         validate(v.thicknessPrice),    ctrl.upsertThicknessPrice);

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
