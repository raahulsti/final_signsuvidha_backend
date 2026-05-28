const db = require('../config/db');

const create = ({ user_id, type, title, body, reference_type, reference_id, data }) =>
  db.execute(
    `INSERT INTO notifications
       (user_id, type, title, body, reference_type, reference_id, data, is_read)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      user_id,
      type,
      title,
      body,
      reference_type || null,
      reference_id || null,
      data ? JSON.stringify(data) : null,
    ]
  );

const getByUser = ({ userId, unreadOnly = false, offset = 0, limit = 20 }) => {
  const conds = ['user_id = ?'];
  const vals = [userId];
  if (unreadOnly) conds.push('is_read = 0');
  return db.paginate(
    `SELECT id, user_id, type, title, body, reference_type, reference_id, data,
            is_read, read_at, created_at
     FROM notifications
     WHERE ${conds.join(' AND ')}
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    `SELECT COUNT(*) AS total FROM notifications WHERE ${conds.join(' AND ')}`,
    [...vals, limit, offset],
    vals
  );
};

const getUnreadCount = (userId) =>
  db.findOne(
    'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
    [userId]
  ).then((row) => Number(row?.count || 0));

const getByIdForUser = (id, userId) =>
  db.findOne(
    'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
    [id, userId]
  );

const markRead = (id, userId) =>
  db.execute(
    'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ? AND is_read = 0',
    [id, userId]
  );

const markAllRead = (userId) =>
  db.execute(
    'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0',
    [userId]
  );

module.exports = {
  create,
  getByUser,
  getUnreadCount,
  getByIdForUser,
  markRead,
  markAllRead,
};
