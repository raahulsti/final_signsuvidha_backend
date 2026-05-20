const router   = require('express').Router();
const ctrl     = require('../../controllers/admin/cmsPageController');
const validate = require('../../middleware/validate');
const v        = require('../../validators/admin/cmsPage');

router.get('/', ctrl.getAll);
router.get('/:slug', validate(v.slugParam, 'params'), ctrl.getBySlug);
router.put('/:slug', validate(v.slugParam, 'params'), validate(v.update), ctrl.updateBySlug);

module.exports = router;
