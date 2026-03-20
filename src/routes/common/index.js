const router = require('express').Router();
router.use('/masters', require('./masters'));
module.exports = router;
