const router   = require('express').Router();
const ctrl     = require('../../controllers/customer/profileController');
const validate = require('../../middleware/validate');
const v        = require('../../validators/customer/profile');

router.put('/', validate(v.update), ctrl.updateProfile);

module.exports = router;
