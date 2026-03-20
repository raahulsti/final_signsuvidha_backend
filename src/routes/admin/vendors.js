const router = require('express').Router();
const ctrl   = require('../../controllers/admin/vendorController');

router.get('/',              ctrl.getAll);
router.get('/:id',           ctrl.getOne);
router.put('/:id/approve',   ctrl.approve);
router.put('/:id/reject',    ctrl.reject);
router.put('/:id/toggle',    ctrl.toggleBlock);

module.exports = router;
