const router   = require('express').Router();
const ctrl     = require('../../controllers/admin/orderController');
const validate = require('../../middleware/validate');
const Joi      = require('joi');

const statusSchema = Joi.object({ status: Joi.string().valid('pending','confirmed','processing','shipped','delivered','cancelled','refunded').required() });
const emailInvoiceSchema = Joi.object({ email: Joi.string().email().optional().allow(null, '') });

router.get('/',         ctrl.getAll);
router.get('/:id/invoice/download', ctrl.downloadInvoice);
router.post('/:id/invoice/email', validate(emailInvoiceSchema), ctrl.emailInvoice);
router.get('/:id',      ctrl.getOne);
router.put('/:id/status', validate(statusSchema), ctrl.updateStatus);

module.exports = router;
