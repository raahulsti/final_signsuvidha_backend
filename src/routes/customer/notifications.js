const router = require('express').Router();
const ctrl = require('../../controllers/common/notificationController');

router.get('/', ctrl.getAll);
router.get('/unread-count', ctrl.getUnreadCount);
router.patch('/read-all', ctrl.markAllRead);
router.patch('/:id/read', ctrl.markRead);

module.exports = router;
