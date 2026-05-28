const notificationModel = require('../../models/notificationModel');
const { success, notFound, paginated } = require('../../utils/response');
const { getPagination, getPaginationMeta } = require('../../utils/helpers');

const parseData = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (_) {
    return null;
  }
};

const formatNotification = (row) => ({
  id: row.id,
  type: row.type,
  title: row.title,
  body: row.body,
  reference_type: row.reference_type,
  reference_id: row.reference_id,
  data: parseData(row.data),
  is_read: !!row.is_read,
  read_at: row.read_at,
  created_at: row.created_at,
});

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unread_only } = req.query;
    const { offset, limit: lim } = getPagination(page, limit);
    const unreadOnly = unread_only === 'true' || unread_only === '1';
    const { rows, total } = await notificationModel.getByUser({
      userId: req.user.id,
      unreadOnly,
      offset,
      limit: lim,
    });
    return paginated(
      res,
      rows.map(formatNotification),
      getPaginationMeta(total, page, lim)
    );
  } catch (err) { next(err); }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationModel.getUnreadCount(req.user.id);
    return success(res, { unread_count: count });
  } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
  try {
    const row = await notificationModel.getByIdForUser(req.params.id, req.user.id);
    if (!row) return notFound(res, 'Notification not found');
    await notificationModel.markRead(req.params.id, req.user.id);
    return success(res, {}, 'Notification marked as read');
  } catch (err) { next(err); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await notificationModel.markAllRead(req.user.id);
    return success(res, {}, 'All notifications marked as read');
  } catch (err) { next(err); }
};
