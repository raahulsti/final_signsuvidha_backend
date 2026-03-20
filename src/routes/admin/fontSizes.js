const router   = require('express').Router();
const ctrl     = require('../../controllers/admin/fontSizeController');
const validate = require('../../middleware/validate');

router.get('/',       ctrl.getAll);
router.get('/:id',    ctrl.getOne);
router.post('/',      ctrl.create);
router.put('/:id',    ctrl.update);
router.delete('/:id', ctrl.delete);

module.exports = router;
