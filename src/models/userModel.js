const db     = require('../config/db');
const bcrypt = require('bcryptjs');

const findByEmail = (email) =>
  db.findOne('SELECT * FROM users WHERE email = ?', [email]);

const findById = (id) =>
  db.findOne(
    `SELECT u.id, u.name, u.email, u.phone, u.is_active,
            GROUP_CONCAT(r.name) AS roles_str
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r       ON r.id = ur.role_id
     WHERE u.id = ?
     GROUP BY u.id`,
    [id]
  );

const create = async ({ name, email, phone, password }) => {
  const hash   = bcrypt.hashSync(password, 12);
  const result = await db.execute(
    'INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
    [name, email, phone, hash]
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

const updateProfile = (userId, { name, phone }) =>
  db.execute(
    'UPDATE users SET name = ?, phone = ?, updated_at = NOW() WHERE id = ?',
    [name, phone, userId]
  );

 const findByPhone = (phone) =>
    db.findOne('SELECT * FROM users WHERE phone = ?', [phone]);

module.exports = { findByEmail, findById, create, comparePassword, getRoles, addRole, updateProfile , findByPhone };
