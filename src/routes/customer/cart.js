const router   = require('express').Router();
const ctrl     = require('../../controllers/customer/cartController');
const validate = require('../../middleware/validate');
const v        = require('../../validators/customer/cart');
const { createUploader, ALLOWED_IMAGE_TYPES } = require('../../middleware/uploadS3');
const { S3_FOLDERS } = require('../../utils/constants');

const upload = createUploader(S3_FOLDERS.USER_UPLOADS, ALLOWED_IMAGE_TYPES).single('image');

router.get('/',                       ctrl.getCart);
router.post('/',      upload,         validate(v.addToCart),    ctrl.addItem);
router.put('/:id',    upload,         validate(v.addToCart),    ctrl.updateItem);
router.delete('/:id',                 ctrl.removeItem);
router.get('/:id/vendor-compare',     ctrl.vendorCompare);
router.put('/:id/select-vendor',      validate(v.selectVendor), ctrl.selectVendor);

module.exports = router;
