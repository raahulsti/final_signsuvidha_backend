const router = require('express').Router();
const ctrl = require('../../controllers/admin/imageAssetController');
const validate = require('../../middleware/validate');
const v = require('../../validators/admin/imageAsset');
const { createUploader, ALLOWED_IMAGE_TYPES } = require('../../middleware/uploadS3');
const { S3_FOLDERS } = require('../../utils/constants');

// Image assets (wallpaper/base/frame/pylon) are often heavier than regular master images.
const upload = createUploader(S3_FOLDERS.IMAGE_ASSETS, ALLOWED_IMAGE_TYPES, 20).single('image');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', upload, validate(v.create), ctrl.create);
router.put('/:id', upload, validate(v.update), ctrl.update);
router.delete('/:id', ctrl.delete);

module.exports = router;
