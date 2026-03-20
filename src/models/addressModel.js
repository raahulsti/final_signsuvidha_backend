const db = require('../config/db');

const getAll   = (userId) => db.execute('SELECT * FROM customer_addresses WHERE user_id = ? ORDER BY is_default DESC, id ASC', [userId]);
const getById  = (id, userId) => db.findOne('SELECT * FROM customer_addresses WHERE id = ? AND user_id = ?', [id, userId]);

const create = ({ user_id, address_title, full_name, phone, email, address_line1,
                  address_line2, city, state, pincode, country, is_default, billing_type }) =>
  db.execute(
    `INSERT INTO customer_addresses
       (user_id, address_title, full_name, phone, email, address_line1, address_line2, city, state, pincode, country, is_default, billing_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
  return db.execute(`UPDATE customer_addresses SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`, values);
};

const remove = (id, userId) => db.execute('DELETE FROM customer_addresses WHERE id = ? AND user_id = ?', [id, userId]);

const setDefault = async (id, userId) => {
  await db.execute('UPDATE customer_addresses SET is_default = 0 WHERE user_id = ?', [userId]);
  await db.execute('UPDATE customer_addresses SET is_default = 1 WHERE id = ? AND user_id = ?', [id, userId]);
};

module.exports = { getAll, getById, create, update, remove, setDefault };
