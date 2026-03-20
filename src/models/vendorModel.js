const db = require('../config/db');

const getAll = ({ isApproved, isActive, offset, limit }) => {
  const conds = []; const vals = [];
  if (isApproved !== undefined) { conds.push('v.is_approved = ?'); vals.push(isApproved); }
  if (isActive   !== undefined) { conds.push('v.is_active = ?');   vals.push(isActive); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const sql = `
    SELECT v.*, u.name AS owner_name, u.email, u.phone
    FROM vendors v LEFT JOIN users u ON u.id = v.user_id
    ${where} ORDER BY v.created_at DESC LIMIT ? OFFSET ?
  `;
  return db.paginate(sql, `SELECT COUNT(*) AS total FROM vendors v ${where}`,
    [...vals, limit, offset], vals);
};

const getById     = (id)     => db.findOne('SELECT v.*, u.name AS owner_name, u.email FROM vendors v LEFT JOIN users u ON u.id = v.user_id WHERE v.id = ?', [id]);
const getByUserId = (userId) => db.findOne('SELECT * FROM vendors WHERE user_id = ?', [userId]);

const create = ({ user_id, business_name, gst_number, address, city, state, pincode }) =>
  db.execute(
    'INSERT INTO vendors (user_id, business_name, gst_number, address, city, state, pincode) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [user_id, business_name, gst_number || null, address || null, city || null, state || null, pincode || null]
  );

const approve = (id, approvedBy) =>
  db.execute('UPDATE vendors SET is_approved = 1, approved_at = NOW(), approved_by = ? WHERE id = ?', [approvedBy, id]);

const reject = (id) =>
  db.execute('UPDATE vendors SET is_approved = 0 WHERE id = ?', [id]);

const toggleActive = (id, isActive) =>
  db.execute('UPDATE vendors SET is_active = ? WHERE id = ?', [isActive, id]);

const update = (id, fields) => {
  const allowed = ['business_name','gst_number','logo_url','address','city','state','pincode'];
  const sets = []; const values = [];
  allowed.forEach((k) => { if (fields[k] !== undefined) { sets.push(`${k} = ?`); values.push(fields[k]); } });
  if (!sets.length) return Promise.resolve(null);
  values.push(id);
  return db.execute(`UPDATE vendors SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
};

const getAllApproved = () =>
  db.execute('SELECT id, business_name, logo_url FROM vendors WHERE is_approved = 1 AND is_active = 1');

module.exports = { getAll, getById, getByUserId, create, approve, reject, toggleActive, update, getAllApproved };
