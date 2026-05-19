const db = require('../config/db');
const { LOLLIPOP_ELEMENT_SHAPES, LOLLIPOP_PRODUCT_TYPE_ID } = require('../utils/constants');

const normalizeShape = (v) => {
  const s = String(v || '').toLowerCase().trim();
  return LOLLIPOP_ELEMENT_SHAPES.includes(s) ? s : 'circle';
};

const getAll = ({ productTypeId, isActive, offset, limit }) => {
  const conditions = [];
  const values = [];

  if (productTypeId !== undefined) { conditions.push('le.product_type_id = ?'); values.push(productTypeId); }
  if (isActive !== undefined) { conditions.push('le.is_active = ?'); values.push(isActive); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT le.*, pt.name AS product_type_name, pt.slug AS product_type_slug
    FROM lollipop_elements le
    LEFT JOIN product_types pt ON pt.id = le.product_type_id
    ${where}
    ORDER BY le.sort_order ASC, le.shape ASC
    LIMIT ? OFFSET ?
  `;
  return db.paginate(sql, `SELECT COUNT(*) AS total FROM lollipop_elements le ${where}`, [...values, limit, offset], values);
};

const getById = (id) =>
  db.findOne(
    `SELECT le.*, pt.name AS product_type_name
     FROM lollipop_elements le
     LEFT JOIN product_types pt ON pt.id = le.product_type_id
     WHERE le.id = ?`,
    [id]
  );

const create = ({
  product_type_id = LOLLIPOP_PRODUCT_TYPE_ID,
  shape,
  name,
  description,
  thumbnail_url,
  file_url,
  admin_price,
  sort_order,
}) =>
  db.execute(
    `INSERT INTO lollipop_elements
       (product_type_id, shape, name, description, thumbnail_url, file_url, admin_price, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product_type_id,
      normalizeShape(shape),
      name || null,
      description || null,
      thumbnail_url || null,
      file_url || null,
      admin_price ?? 0,
      sort_order || 0,
    ]
  );

const update = (id, fields) => {
  const allowed = ['name', 'description', 'thumbnail_url', 'file_url', 'admin_price', 'sort_order', 'is_active', 'shape'];
  const sets = [];
  const values = [];

  allowed.forEach((key) => {
    if (fields[key] !== undefined) {
      let v = fields[key];
      if (key === 'shape') v = normalizeShape(v);
      sets.push(`${key} = ?`);
      values.push(v);
    }
  });
  if (!sets.length) return Promise.resolve(null);
  values.push(id);
  return db.execute(`UPDATE lollipop_elements SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
};

const remove = (id) => db.execute('DELETE FROM lollipop_elements WHERE id = ?', [id]);

module.exports = { getAll, getById, create, update, remove, normalizeShape };
