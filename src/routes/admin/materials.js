const router   = require('express').Router();
const ctrl     = require('../../controllers/admin/materialController');
const validate = require('../../middleware/validate');
const v        = require('../../validators/admin/material');
const { createUploader, ALLOWED_IMAGE_TYPES } = require('../../middleware/uploadS3');
const { S3_FOLDERS } = require('../../utils/constants');

const upload = createUploader(S3_FOLDERS.MATERIALS, ALLOWED_IMAGE_TYPES).single('image');

router.get('/',       ctrl.getAll);
router.get('/:id',    ctrl.getOne);
router.post('/',      upload, validate(v.create), ctrl.create);
router.put('/:id',    upload, validate(v.update), ctrl.update);
router.delete('/:id', ctrl.delete);

module.exports = router;
