const router   = require('express').Router();
const ctrl     = require('../../controllers/admin/baseColorController');
const validate = require('../../middleware/validate');
const v        = require('../../validators/admin/baseColor');

router.get('/',                      ctrl.getAll);
router.post('/',                     validate(v.create), ctrl.create);
router.put('/:id',                   validate(v.update), ctrl.update);
router.delete('/:id',                ctrl.delete);
router.post('/:id/assign-products',  ctrl.assignProducts);

module.exports = router;
