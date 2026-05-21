const db = require('../config/db');

const getAll = (userId) =>
  db.execute(
    'SELECT * FROM customer_addresses WHERE user_id = ? AND is_active = 1 ORDER BY is_default DESC, id ASC',
    [userId]
  );

const getById = (id, userId) =>
  db.findOne('SELECT * FROM customer_addresses WHERE id = ? AND user_id = ?', [id, userId]);

const getActiveById = (id, userId) =>
  db.findOne(
    'SELECT * FROM customer_addresses WHERE id = ? AND user_id = ? AND is_active = 1',
    [id, userId]
  );

const create = ({ user_id, address_title, full_name, phone, email, address_line1,
                  address_line2, city, state, pincode, country, is_default, billing_type }) =>
  db.execute(
    `INSERT INTO customer_addresses
       (user_id, address_title, full_name, phone, email, address_line1, address_line2, city, state, pincode, country, is_default, billing_type, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [user_id, address_title || null, full_name, phone, email || null,
     address_line1, address_line2 || null, city, state, pincode,
     country || 'India', is_default ? 1 : 0, billing_type || 'personal']
  );

const update = (id, userId, fields) => {
  const allowed = ['address_title','full_name','phone','email','address_line1','address_line2','city','state','pincode','is_default','billing_type'];
  const sets = []; const values = [];
  allowed.forEach((k) => { if (fields[k] !== undefined) { sets.push(`${k} = ?`); values.push(fields[k]); } });
  if (!sets.length) return Promise.resolve(null);
  values.push(id, userId);
  return db.execute(
    `UPDATE customer_addresses SET ${sets.join(', ')} WHERE id = ? AND user_id = ? AND is_active = 1`,
    values
  );
};

const deactivate = (id, userId) =>
  db.execute(
    'UPDATE customer_addresses SET is_active = 0, is_default = 0 WHERE id = ? AND user_id = ? AND is_active = 1',
    [id, userId]
  );

const setDefault = async (id, userId) => {
  await db.execute('UPDATE customer_addresses SET is_default = 0 WHERE user_id = ? AND is_active = 1', [userId]);
  await db.execute(
    'UPDATE customer_addresses SET is_default = 1 WHERE id = ? AND user_id = ? AND is_active = 1',
    [id, userId]
  );
};

module.exports = {
  getAll, getById, getActiveById, create, update, deactivate, setDefault,
  remove: deactivate,
};
