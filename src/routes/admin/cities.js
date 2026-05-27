const router = require('express').Router();
const ctrl = require('../../controllers/admin/cityController');
const validate = require('../../middleware/validate');
const v = require('../../validators/admin/city');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', validate(v.create), ctrl.create);
router.put('/:id', validate(v.update), ctrl.update);
router.delete('/:id', ctrl.delete);

module.exports = router;
