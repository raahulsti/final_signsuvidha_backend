const db = require('../config/db');

const getAll = ({ productTypeId, isActive, offset, limit }) => {
  const conditions = [];
  const values = [];

  if (productTypeId !== undefined) { conditions.push('ms.product_type_id = ?'); values.push(productTypeId); }
  if (isActive      !== undefined) { conditions.push('ms.is_active = ?');       values.push(isActive); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT ms.*, pt.name AS product_type_name, pt.slug AS product_type_slug
    FROM material_styles ms
    LEFT JOIN product_types pt ON pt.id = ms.product_type_id
    ${where}
    ORDER BY ms.sort_order ASC, ms.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const countSql = `SELECT COUNT(*) AS total FROM material_styles ms ${where}`;

  return db.paginate(sql, countSql, [...values, limit, offset], values);
};

const getById = (id) =>
  db.findOne(
    `SELECT ms.*, pt.name AS product_type_name
     FROM material_styles ms
     LEFT JOIN product_types pt ON pt.id = ms.product_type_id
     WHERE ms.id = ?`,
    [id]
  );

const create = ({ product_type_id, name, description, admin_price_per_sqft, sort_order }) =>
  db.execute(
    `INSERT INTO material_styles
       (product_type_id, name, description, admin_price_per_sqft, sort_order)
     VALUES (?, ?, ?, ?, ?)`,
    [product_type_id, name, description || null, admin_price_per_sqft, sort_order || 0]
  );

const update = (id, fields) => {
  const allowed = ['name', 'description', 'admin_price_per_sqft', 'sort_order', 'is_active'];
  const sets = [];
  const values = [];

  allowed.forEach((key) => {
    if (fields[key] !== undefined) { sets.push(`${key} = ?`); values.push(fields[key]); }
  });
  if (!sets.length) return Promise.resolve(null);

  values.push(id);
  return db.execute(`UPDATE material_styles SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
};

const remove = (id) => db.execute('DELETE FROM material_styles WHERE id = ?', [id]);

module.exports = { getAll, getById, create, update, remove };
