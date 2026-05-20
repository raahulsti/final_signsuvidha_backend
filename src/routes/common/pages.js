const router   = require('express').Router();
const ctrl     = require('../../controllers/common/pagesController');
const validate = require('../../middleware/validate');
const v        = require('../../validators/admin/cmsPage');

router.get('/:slug', validate(v.slugParam, 'params'), ctrl.getBySlug);

module.exports = router;
