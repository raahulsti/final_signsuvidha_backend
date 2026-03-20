const router = require('express').Router();
const ctrl   = require('../../controllers/vendor/dashboardController');
router.get('/stats', ctrl.getStats);
module.exports = router;
