const router   = require('express').Router();
const ctrl     = require('../../controllers/admin/fontController');
const validate = require('../../middleware/validate');
const v        = require('../../validators/admin/font');
const { createUploader, ALLOWED_FONT_TYPES } = require('../../middleware/uploadS3');
const { S3_FOLDERS } = require('../../utils/constants');

const upload = createUploader(S3_FOLDERS.FONTS, ALLOWED_FONT_TYPES).single('font_file');

router.get('/',       ctrl.getAll);
router.post('/',      upload, validate(v.create), ctrl.create);
router.put('/:id',    upload, validate(v.update), ctrl.update);
router.delete('/:id', ctrl.delete);
router.post('/:id/assign-products', ctrl.assignProducts);

module.exports = router;
