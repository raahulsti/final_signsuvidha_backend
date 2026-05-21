const router    = require('express').Router();
const ctrl      = require('../controllers/authController');
const validate  = require('../middleware/validate');
const auth      = require('../middleware/auth');
const { createProfileImageUploader, applyProfileImageUpload } = require('../middleware/uploadS3');
const { S3_FOLDERS } = require('../utils/constants');
// const { authLimiter } = require('../middleware/rateLimiter');
const v         = require('../validators/auth');

const registerUpload = createProfileImageUploader(S3_FOLDERS.CUSTOMER_PROFILES, undefined, 5);

// TODO: re-enable authLimiter on these routes when ready (prevents "Too many auth attempts")
router.post('/register', registerUpload, validate(v.register), applyProfileImageUpload, ctrl.register);
router.post('/login',        validate(v.login),      ctrl.login);
router.post('/otp/send',     validate(v.otpSend),    ctrl.sendOtp);
router.post('/otp/verify',   validate(v.otpVerify),  ctrl.verifyOtp);
router.post('/reset-password', validate(v.resetPassword), ctrl.resetPassword);
router.post('/logout',       auth,                                 ctrl.logout);
router.get('/me',            auth,                                 ctrl.getMe);

module.exports = router;
