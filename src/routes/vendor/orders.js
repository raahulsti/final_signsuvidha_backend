const router   = require('express').Router();
const ctrl     = require('../../controllers/vendor/orderController');
const validate = require('../../middleware/validate');
const Joi      = require('joi');

const statusSchema = Joi.object({
  status: Joi.string().valid('confirmed','processing','shipped').required(),
});

router.get('/',              ctrl.getOrders);
router.get('/:id',           ctrl.getOne);
router.put('/:id/status',    validate(statusSchema), ctrl.updateStatus);

module.exports = router;
