const router    = require('express').Router();
const ctrl      = require('../controllers/authController');
const validate  = require('../middleware/validate');
const auth      = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const v         = require('../validators/auth');

router.post('/register',     authLimiter, validate(v.register),   ctrl.register);
router.post('/login',        authLimiter, validate(v.login),      ctrl.login);
router.post('/otp/send',     authLimiter, validate(v.otpSend),    ctrl.sendOtp);
router.post('/otp/verify',   authLimiter, validate(v.otpVerify),  ctrl.verifyOtp);
router.post('/logout',       auth,                                 ctrl.logout);
router.get('/me',            auth,                                 ctrl.getMe);

module.exports = router;
