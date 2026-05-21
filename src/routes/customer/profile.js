const router   = require('express').Router();
const ctrl     = require('../../controllers/customer/profileController');
const validate = require('../../middleware/validate');
const v        = require('../../validators/customer/profile');
const { createProfileImageUploader, applyProfileImageUpload } = require('../../middleware/uploadS3');
const { S3_FOLDERS } = require('../../utils/constants');

const profileUpload = createProfileImageUploader(S3_FOLDERS.CUSTOMER_PROFILES, undefined, 5);

router.put('/', profileUpload, applyProfileImageUpload, validate(v.update), ctrl.updateProfile);
module.exports = router;
