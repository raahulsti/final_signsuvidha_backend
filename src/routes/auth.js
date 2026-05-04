const router    = require('express').Router();
const ctrl      = require('../controllers/authController');
const validate  = require('../middleware/validate');
const auth      = require('../middleware/auth');
// const { authLimiter } = require('../middleware/rateLimiter');
const v         = require('../validators/auth');

// TODO: re-enable authLimiter on these routes when ready (prevents "Too many auth attempts")
router.post('/register',     validate(v.register),   ctrl.register);
router.post('/login',        validate(v.login),      ctrl.login);
router.post('/otp/send',     validate(v.otpSend),    ctrl.sendOtp);
router.post('/otp/verify',   validate(v.otpVerify),  ctrl.verifyOtp);
router.post('/reset-password', validate(v.resetPassword), ctrl.resetPassword);
router.post('/logout',       auth,                                 ctrl.logout);
router.get('/me',            auth,                                 ctrl.getMe);

module.exports = router;
