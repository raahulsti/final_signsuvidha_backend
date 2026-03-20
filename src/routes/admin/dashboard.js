const router = require('express').Router();
const ctrl   = require('../../controllers/admin/dashboardController');
router.get('/stats', ctrl.getStats);
module.exports = router;
