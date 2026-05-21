const router   = require('express').Router();
const ctrl     = require('../../controllers/admin/pylonController');
const validate = require('../../middleware/validate');
const v        = require('../../validators/admin/pylon');
const vCat     = require('../../validators/admin/pylonCategory');
const { createUploader, ALLOWED_IMAGE_TYPES } = require('../../middleware/uploadS3');
const { S3_FOLDERS } = require('../../utils/constants');

const upload = createUploader(S3_FOLDERS.PYLONS, ALLOWED_IMAGE_TYPES).single('image');

router.get('/',       ctrl.getAll);
router.get('/:id',    ctrl.getOne);
router.post('/',      upload, validate(v.create), ctrl.create);
router.put('/:id',    upload, validate(v.update), ctrl.update);
router.delete('/:id', ctrl.delete);

router.get('/:pylonId/categories',                    ctrl.getCategories);
router.post('/:pylonId/categories', validate(vCat.create), ctrl.createCategory);
router.put('/:pylonId/categories/:categoryId', validate(vCat.update), ctrl.updateCategory);
router.delete('/:pylonId/categories/:categoryId',   ctrl.deleteCategory);

module.exports = router;
