const db = require('../config/db');

const getAll = ({ productTypeId, isActive, offset, limit }) => {
  const conditions = [];
  const values     = [];

  if (productTypeId !== undefined) { conditions.push('m.product_type_id = ?'); values.push(productTypeId); }
  if (isActive      !== undefined) { conditions.push('m.is_active = ?');       values.push(isActive); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT m.*, pt.name AS product_type_name, pt.slug AS product_type_slug
    FROM materials m
    LEFT JOIN product_types pt ON pt.id = m.product_type_id
    ${where}
    ORDER BY m.sort_order ASC, m.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const countSql = `SELECT COUNT(*) AS total FROM materials m ${where}`;

  return db.paginate(sql, countSql, [...values, limit, offset], values);
};

const getById = (id) =>
  db.findOne(
    `SELECT m.*, pt.name AS product_type_name
     FROM materials m
     LEFT JOIN product_types pt ON pt.id = m.product_type_id
     WHERE m.id = ?`,
    [id]
  );

const create = ({ product_type_id, name, description, thumbnail_url, file_url, admin_price_per_sqft, sort_order }) =>
  db.execute(
    `INSERT INTO materials
       (product_type_id, name, description, thumbnail_url, file_url, admin_price_per_sqft, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [product_type_id, name, description || null, thumbnail_url || null, file_url || null, admin_price_per_sqft, sort_order || 0]
  );

const update = (id, fields) => {
  const allowed = ['name','description','thumbnail_url','file_url','admin_price_per_sqft','sort_order','is_active'];
  const sets    = [];
  const values  = [];

  allowed.forEach((key) => {
    if (fields[key] !== undefined) { sets.push(`${key} = ?`); values.push(fields[key]); }
  });
  if (!sets.length) return Promise.resolve(null);

  values.push(id);
  return db.execute(`UPDATE materials SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
};

const remove = (id) =>
  db.execute('DELETE FROM materials WHERE id = ?', [id]);

const getFileUrl = (id) =>
  db.findOne('SELECT file_url FROM materials WHERE id = ?', [id]);

module.exports = { getAll, getById, create, update, remove, getFileUrl };
