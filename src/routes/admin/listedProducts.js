const router   = require('express').Router();
const ctrl     = require('../../controllers/admin/listedProductController');
const validate = require('../../middleware/validate');
const v        = require('../../validators/admin/listedProduct');
const { createUploader, ALLOWED_IMAGE_TYPES } = require('../../middleware/uploadS3');
const { S3_FOLDERS } = require('../../utils/constants');

const upload = createUploader(S3_FOLDERS.LISTED_PRODUCTS, ALLOWED_IMAGE_TYPES).array('images', 12);

router.get('/',       ctrl.getAll);
router.get('/:id',    ctrl.getOne);
router.post('/',      upload, validate(v.create), ctrl.create);
router.put('/:id',    upload, validate(v.update), ctrl.update);
router.delete('/:id', ctrl.delete);

module.exports = router;
