const db = require('../config/db');
const { BORDER_SHAPES, BORDER_SIZES, LOLLIPOP_PRODUCT_TYPE_ID } = require('../utils/constants');

const normalizeShape = (v) => {
  const s = String(v || '').toLowerCase().trim();
  return BORDER_SHAPES.includes(s) ? s : 'circle';
};

const normalizeSize = (v) => {
  const s = String(v || '').toLowerCase().trim();
  return BORDER_SIZES.includes(s) ? s : 'small';
};

const getAll = ({ productTypeId, isActive, offset, limit }) => {
  const conditions = [];
  const values = [];

  if (productTypeId !== undefined) { conditions.push('ab.product_type_id = ?'); values.push(productTypeId); }
  if (isActive !== undefined) { conditions.push('ab.is_active = ?'); values.push(isActive); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT ab.*, pt.name AS product_type_name, pt.slug AS product_type_slug
    FROM add_borders ab
    LEFT JOIN product_types pt ON pt.id = ab.product_type_id
    ${where}
    ORDER BY ab.sort_order ASC, ab.shape ASC, ab.size ASC
    LIMIT ? OFFSET ?
  `;
  return db.paginate(sql, `SELECT COUNT(*) AS total FROM add_borders ab ${where}`, [...values, limit, offset], values);
};

const getById = (id) =>
  db.findOne(
    `SELECT ab.*, pt.name AS product_type_name
     FROM add_borders ab
     LEFT JOIN product_types pt ON pt.id = ab.product_type_id
     WHERE ab.id = ?`,
    [id]
  );

const create = ({
  product_type_id = LOLLIPOP_PRODUCT_TYPE_ID,
  shape,
  size,
  name,
  description,
  thumbnail_url,
  file_url,
  admin_price,
  lit_price,
  sort_order,
}) =>
  db.execute(
    `INSERT INTO add_borders
       (product_type_id, shape, size, name, description, thumbnail_url, file_url, admin_price, lit_price, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product_type_id,
      normalizeShape(shape),
      normalizeSize(size),
      name || null,
      description || null,
      thumbnail_url || null,
      file_url || null,
      admin_price ?? 0,
      lit_price ?? 0,
      sort_order || 0,
    ]
  );

const update = (id, fields) => {
  const allowed = ['name', 'description', 'thumbnail_url', 'file_url', 'admin_price', 'lit_price', 'sort_order', 'is_active', 'shape', 'size'];
  const sets = [];
  const values = [];

  allowed.forEach((key) => {
    if (fields[key] !== undefined) {
      let v = fields[key];
      if (key === 'shape') v = normalizeShape(v);
      if (key === 'size') v = normalizeSize(v);
      sets.push(`${key} = ?`);
      values.push(v);
    }
  });
  if (!sets.length) return Promise.resolve(null);
  values.push(id);
  return db.execute(`UPDATE add_borders SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
};

const remove = (id) => db.execute('DELETE FROM add_borders WHERE id = ?', [id]);

module.exports = { getAll, getById, create, update, remove, normalizeShape, normalizeSize };
