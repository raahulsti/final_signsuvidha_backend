const router   = require('express').Router();
const ctrl     = require('../../controllers/customer/orderController');
const validate = require('../../middleware/validate');
const v        = require('../../validators/customer/order');

router.post('/checkout',              validate(v.checkout), ctrl.checkout);
router.post('/payment/initiate',      validate(v.initiateBatchPayment), ctrl.initiateBatchPayment);
router.post('/payment/verify',        validate(v.verifyPayment), ctrl.verifyBatchPayment);
router.post('/payment/fail',          validate(v.failBatchPayment), ctrl.failBatchPayment);
router.get('/',                       ctrl.getOrders);
router.get('/:id',                    ctrl.getOne);
router.post('/:id/payment',           validate(v.payment),  ctrl.initiatePayment);
router.post('/:id/payment/verify',    validate(v.verifyPayment), ctrl.verifyPayment);

module.exports = router;
