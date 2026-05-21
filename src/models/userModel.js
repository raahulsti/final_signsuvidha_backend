const db     = require('../config/db');
const bcrypt = require('bcryptjs');

const findByEmail = (email) =>
  db.findOne('SELECT * FROM users WHERE email = ?', [email]);

const findById = (id) =>
  db.findOne(
    `SELECT u.id, u.name, u.email, u.phone, u.gender, u.date_of_birth, u.profile_image_url, u.is_active,
            GROUP_CONCAT(r.name) AS roles_str
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r       ON r.id = ur.role_id
     WHERE u.id = ?
     GROUP BY u.id`,
    [id]
  );

const create = async ({ name, email, phone, gender, date_of_birth, profile_image_url, password, is_active = 1 }) => {
  const effectivePassword = password || `OTP_ONLY_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const hash   = bcrypt.hashSync(effectivePassword, 12);
  const result = await db.execute(
    `INSERT INTO users (name, email, phone, gender, date_of_birth, profile_image_url, password_hash, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, email, phone, gender || null, date_of_birth || null, profile_image_url || null, hash, is_active ? 1 : 0]
  );
  return result.insertId;
};

const comparePassword = (plain, hash) => bcrypt.compareSync(plain, hash);

const getRoles = (userId) =>
  db.execute(
    `SELECT r.name FROM roles r
     INNER JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = ?`,
    [userId]
  );

const addRole = async (userId, roleName) => {
  const role = await db.findOne('SELECT id FROM roles WHERE name = ?', [roleName]);
  if (!role) throw new Error(`Role '${roleName}' not found`);
  await db.execute(
    'INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)',
    [userId, role.id]
  );
};

const updateCustomerProfile = (userId, fields) => {
  const allowed = ['name', 'gender', 'date_of_birth', 'profile_image_url'];
  const sets = [];
  const values = [];
  allowed.forEach((k) => {
    if (fields[k] !== undefined) {
      sets.push(`${k} = ?`);
      values.push(fields[k]);
    }
  });
  if (!sets.length) return Promise.resolve(null);
  values.push(userId);
  return db.execute(`UPDATE users SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
};

const findByPhone = (phone) =>
  db.findOne('SELECT * FROM users WHERE phone = ?', [phone]);

const findCustomerByPhone = (phone) =>
  db.findOne(
    `SELECT u.*
     FROM users u
     INNER JOIN user_roles ur ON ur.user_id = u.id
     INNER JOIN roles r ON r.id = ur.role_id
     WHERE u.phone = ? AND r.name = 'customer'
     LIMIT 1`,
    [phone]
  );

const setActive = (userId, isActive) =>
  db.execute('UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?', [isActive ? 1 : 0, userId]);

module.exports = {
  findByEmail, findById, create, comparePassword, getRoles, addRole,
  updateCustomerProfile, findByPhone, findCustomerByPhone, setActive,
};
