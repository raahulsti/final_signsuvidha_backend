const router   = require('express').Router();
const ctrl     = require('../../controllers/vendor/profileController');
const { createUploader, ALLOWED_IMAGE_TYPES } = require('../../middleware/uploadS3');
const { S3_FOLDERS } = require('../../utils/constants');

const upload = createUploader(S3_FOLDERS.VENDOR_LOGOS, ALLOWED_IMAGE_TYPES).single('logo');

router.get('/',  ctrl.getProfile);
router.put('/',  upload, ctrl.updateProfile);

module.exports = router;
