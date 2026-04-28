const db = require('../config/db');

const getAll = ({ productTypeId, category, isActive }) => {
  const conds = [];
  const vals = [];
  if (productTypeId !== undefined && productTypeId !== null && productTypeId !== '') {
    conds.push('io.product_type_id = ?');
    vals.push(Number(productTypeId));
  }
  if (category) {
    conds.push('io.category = ?');
    vals.push(category);
  }
  if (isActive !== undefined) {
    conds.push('io.is_active = ?');
    vals.push(isActive);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  return db.execute(
    `SELECT io.*, pt.name AS product_type_name
     FROM illumination_options io
     LEFT JOIN product_types pt ON pt.id = io.product_type_id
     ${where}
     ORDER BY io.product_type_id ASC, io.category ASC, io.sort_order ASC, io.id ASC`,
    vals
  );
};

const getById = (id) =>
  db.findOne(
    `SELECT io.*, pt.name AS product_type_name
     FROM illumination_options io
     LEFT JOIN product_types pt ON pt.id = io.product_type_id
     WHERE io.id = ?`,
    [id]
  );

const create = ({
  product_type_id,
  category,
  name,
  description,
  preview_image_url,
  admin_price_per_sqft,
  sort_order,
  is_active,
}) =>
  db.execute(
    `INSERT INTO illumination_options
      (product_type_id, category, name, description, preview_image_url, admin_price_per_sqft, sort_order, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product_type_id,
      category,
      name,
      description || null,
      preview_image_url || null,
      admin_price_per_sqft ?? 0,
      sort_order ?? 0,
      is_active !== undefined ? is_active : 1,
    ]
  );

const update = (id, fields) => {
  const allowed = [
    'product_type_id',
    'category',
    'name',
    'description',
    'preview_image_url',
    'admin_price_per_sqft',
    'sort_order',
    'is_active',
  ];
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
  return db.execute(`UPDATE illumination_options SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
};

const remove = (id) => db.execute('DELETE FROM illumination_options WHERE id = ?', [id]);

module.exports = { getAll, getById, create, update, remove };
