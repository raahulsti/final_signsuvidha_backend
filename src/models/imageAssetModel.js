const db = require('../config/db');

const getAll = ({ productTypeId, imageType, isActive, offset, limit }) => {
  const conds = [];
  const vals = [];
  if (productTypeId !== undefined && productTypeId !== null && productTypeId !== '') {
    conds.push('ia.product_type_id = ?');
    vals.push(Number(productTypeId));
  }
  if (imageType !== undefined && imageType !== null && String(imageType).trim() !== '') {
    conds.push('ia.image_type = ?');
    vals.push(String(imageType).trim());
  }
  if (isActive !== undefined) { conds.push('ia.is_active = ?'); vals.push(isActive); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 20;
  const safeOffset = Number.isFinite(Number(offset)) && Number(offset) >= 0 ? Number(offset) : 0;

  const sql = `
    SELECT ia.*, pt.name AS product_type_name, pt.slug AS product_type_slug
    FROM image_assets ia
    LEFT JOIN product_types pt ON pt.id = ia.product_type_id
    ${where}
    ORDER BY ia.sort_order ASC, ia.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const countSql = `SELECT COUNT(*) AS total FROM image_assets ia ${where}`;
  return db.paginate(sql, countSql, [...vals, safeLimit, safeOffset], vals);
};

const getById = (id) =>
  db.findOne(
    `SELECT ia.*, pt.name AS product_type_name, pt.slug AS product_type_slug
     FROM image_assets ia
     LEFT JOIN product_types pt ON pt.id = ia.product_type_id
     WHERE ia.id = ?`,
    [id]
  );

const create = ({ product_type_id, image_type, title, image_url, thumbnail_url, sort_order, is_active }) =>
  db.execute(
    `INSERT INTO image_assets
      (product_type_id, image_type, title, image_url, thumbnail_url, sort_order, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      product_type_id,
      image_type,
      title || null,
      image_url,
      thumbnail_url || image_url,
      sort_order || 0,
      is_active !== undefined ? is_active : 1,
    ]
  );

const update = (id, fields) => {
  const allowed = ['product_type_id', 'image_type', 'title', 'image_url', 'thumbnail_url', 'sort_order', 'is_active'];
  const sets = [];
  const values = [];
  allowed.forEach((k) => {
    if (fields[k] !== undefined) {
      sets.push(`${k} = ?`);
      values.push(fields[k]);
    }
  });
  if (!sets.length) return Promise.resolve(null);
  values.push(id);
  return db.execute(`UPDATE image_assets SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
};

const remove = (id) => db.execute('DELETE FROM image_assets WHERE id = ?', [id]);

module.exports = { getAll, getById, create, update, remove };
