const router   = require('express').Router();
const ctrl     = require('../../controllers/customer/orderController');
const validate = require('../../middleware/validate');
const v        = require('../../validators/customer/order');

router.post('/checkout',              validate(v.checkout), ctrl.checkout);
router.get('/',                       ctrl.getOrders);
router.get('/:id',                    ctrl.getOne);
router.post('/:id/payment',           validate(v.payment),  ctrl.initiatePayment);
router.post('/:id/payment/verify',    ctrl.verifyPayment);

module.exports = router;
