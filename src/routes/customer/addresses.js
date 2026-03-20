const router   = require('express').Router();
const ctrl     = require('../../controllers/customer/addressController');
const validate = require('../../middleware/validate');
const v        = require('../../validators/customer/address');

router.get('/',       ctrl.getAll);
router.get('/:id',    ctrl.getOne);
router.post('/',      validate(v.create), ctrl.create);
router.put('/:id',    validate(v.update), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
