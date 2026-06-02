const router = require('express').Router();
const ctrl   = require('../../controllers/admin/customerController');

router.get('/',           ctrl.getAll);
router.get('/:id/orders', ctrl.getOrders);
router.get('/:id',        ctrl.getOne);

module.exports = router;
