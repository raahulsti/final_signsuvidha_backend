const router   = require('express').Router();
const ctrl     = require('../../controllers/customer/cartController');
const validate = require('../../middleware/validate');
const v        = require('../../validators/customer/cart');
const vListed  = require('../../validators/customer/cartListed');
const { createCartUploader, applyCartUploadedFiles, ALLOWED_IMAGE_TYPES } = require('../../middleware/uploadS3');
const { S3_FOLDERS } = require('../../utils/constants');

const cartUpload = createCartUploader(S3_FOLDERS.USER_UPLOADS, ALLOWED_IMAGE_TYPES, 20);

router.get('/',                       ctrl.getCart);
router.get('/listed',                 ctrl.getListedCart);
router.post('/listed',                validate(vListed.addListed), ctrl.addListedItem);
router.post('/',      cartUpload, applyCartUploadedFiles, validate(v.addToCart), ctrl.addItem);
router.put('/:id',    cartUpload, applyCartUploadedFiles, validate(v.addToCart), ctrl.updateItem);
router.patch('/:id/quantity/increase',                             ctrl.increaseQuantity);
router.patch('/:id/quantity/decrease',                             ctrl.decreaseQuantity);
router.patch('/:id/quantity',                                      ctrl.setQuantity);
router.delete('/:id',                 ctrl.removeItem);
router.get('/:id/vendor-compare',     ctrl.vendorCompare);
router.put('/:id/select-vendor',      validate(v.selectVendor), ctrl.selectVendor);

module.exports = router;
