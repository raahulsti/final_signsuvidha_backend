const router = require('express').Router();
const ctrl   = require('../../controllers/admin/productTypeController');

router.get('/',    ctrl.getAll);
router.put('/:id', ctrl.update);

module.exports = router;
