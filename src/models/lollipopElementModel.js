const db = require('../config/db');
const { LOLLIPOP_PRODUCT_TYPE_ID } = require('../utils/constants');

/** Customer / masters API shape */
const toPublicRow = (row) => {
  if (!row) return row;
  const image = row.file_url || row.thumbnail_url || null;
  return {
    id: row.id,
    product_type_id: row.product_type_id,
    name: row.name,
    description: row.description,
    price: parseFloat(row.admin_price || 0),
    admin_price: parseFloat(row.admin_price || 0),
    image,
    file_url: row.file_url,
    thumbnail_url: row.thumbnail_url,
    sort_order: row.sort_order,
    is_active: row.is_active,
    product_type_name: row.product_type_name,
    product_type_slug: row.product_type_slug,
  };
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
    ORDER BY le.sort_order ASC, le.name ASC
    LIMIT ? OFFSET ?
  `;
  return db.paginate(sql, `SELECT COUNT(*) AS total FROM lollipop_elements le ${where}`, [...values, limit, offset], values)
    .then(({ rows, total }) => ({ rows: rows.map(toPublicRow), total }));
};

const getById = (id) =>
  db.findOne(
    `SELECT le.*, pt.name AS product_type_name, pt.slug AS product_type_slug
     FROM lollipop_elements le
     LEFT JOIN product_types pt ON pt.id = le.product_type_id
     WHERE le.id = ?`,
    [id]
  ).then((row) => (row ? toPublicRow(row) : null));

const getByIdRaw = (id) =>
  db.findOne('SELECT * FROM lollipop_elements WHERE id = ?', [id]);

const create = ({
  product_type_id = LOLLIPOP_PRODUCT_TYPE_ID,
  name,
  description,
  thumbnail_url,
  file_url,
  admin_price,
  sort_order,
}) =>
  db.execute(
    `INSERT INTO lollipop_elements
       (product_type_id, name, description, thumbnail_url, file_url, admin_price, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      product_type_id,
      name,
      description || null,
      thumbnail_url || null,
      file_url || null,
      admin_price ?? 0,
      sort_order || 0,
    ]
  );

const update = (id, fields) => {
  const allowed = ['name', 'description', 'thumbnail_url', 'file_url', 'admin_price', 'sort_order', 'is_active'];
  const sets = [];
  const values = [];

  allowed.forEach((key) => {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`);
      values.push(fields[key]);
    }
  });
  if (!sets.length) return Promise.resolve(null);
  values.push(id);
  return db.execute(`UPDATE lollipop_elements SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
};

const remove = (id) => db.execute('DELETE FROM lollipop_elements WHERE id = ?', [id]);

module.exports = { getAll, getById, getByIdRaw, create, update, remove, toPublicRow };
