const db = require('../config/db');

const getCategories = (pylonId, { activeOnly = false } = {}) => {
  const cond = activeOnly ? ' AND is_active = 1' : '';
  return db.execute(
    `SELECT id, pylon_id, name, admin_category_price, tiles_name, admin_tiles_price, sort_order, is_active
     FROM pylon_categories WHERE pylon_id = ?${cond}
     ORDER BY sort_order ASC, id ASC`,
    [pylonId]
  );
};

const getCategoryById = (id) =>
  db.findOne('SELECT * FROM pylon_categories WHERE id = ?', [id]);

const getAll = async ({ productTypeId, isActive, offset, limit } = {}) => {
  const conditions = [];
  const values = [];
  if (productTypeId !== undefined) { conditions.push('p.product_type_id = ?'); values.push(productTypeId); }
  if (isActive !== undefined) { conditions.push('p.is_active = ?'); values.push(isActive); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT p.*, pt.name AS product_type_name, pt.slug AS product_type_slug
    FROM pylons p
    LEFT JOIN product_types pt ON pt.id = p.product_type_id
    ${where}
    ORDER BY p.sort_order ASC, p.id ASC
    LIMIT ? OFFSET ?
  `;
  const countSql = `SELECT COUNT(*) AS total FROM pylons p ${where}`;
  return db.paginate(sql, countSql, [...values, limit, offset], values);
};

const getById = (id) =>
  db.findOne(
    `SELECT p.*, pt.name AS product_type_name, pt.slug AS product_type_slug
     FROM pylons p
     LEFT JOIN product_types pt ON pt.id = p.product_type_id
     WHERE p.id = ?`,
    [id]
  );

const toPublic = async (row, { includeCategories = true, activeCategoriesOnly = true } = {}) => {
  if (!row) return null;
  const categories = includeCategories
    ? await getCategories(row.id, { activeOnly: activeCategoriesOnly })
    : [];
  return {
    id: row.id,
    product_type_id: row.product_type_id,
    product_type_slug: row.product_type_slug || null,
    name: row.name,
    description: row.description,
    thumbnail_url: row.thumbnail_url || row.file_url || null,
    file_url: row.file_url || null,
    sort_order: row.sort_order,
    is_active: !!row.is_active,
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      category_price: parseFloat(c.admin_category_price || 0),
      tiles_name: c.tiles_name,
      tiles_price: parseFloat(c.admin_tiles_price || 0),
      sort_order: c.sort_order,
      is_active: !!c.is_active,
    })),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const toPublicList = (row) => ({
  id: row.id,
  product_type_id: row.product_type_id,
  name: row.name,
  description: row.description,
  thumbnail_url: row.thumbnail_url || row.file_url || null,
  file_url: row.file_url || null,
  sort_order: row.sort_order,
  is_active: !!row.is_active,
});

const create = async ({
  product_type_id, name, description, thumbnail_url, file_url, sort_order, is_active,
}) => {
  const result = await db.execute(
    `INSERT INTO pylons (product_type_id, name, description, thumbnail_url, file_url, sort_order, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      product_type_id,
      name,
      description || null,
      thumbnail_url || null,
      file_url || null,
      sort_order || 0,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
    ]
  );
  return result.insertId;
};

const update = (id, fields) => {
  const allowed = ['product_type_id', 'name', 'description', 'thumbnail_url', 'file_url', 'sort_order', 'is_active'];
  const sets = [];
  const values = [];
  allowed.forEach((key) => {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`);
      values.push(key === 'is_active' ? (fields[key] ? 1 : 0) : fields[key]);
    }
  });
  if (!sets.length) return Promise.resolve(null);
  values.push(id);
  return db.execute(`UPDATE pylons SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
};

const remove = async (id) => {
  await db.execute('DELETE FROM pylon_categories WHERE pylon_id = ?', [id]);
  return db.execute('DELETE FROM pylons WHERE id = ?', [id]);
};

const createCategory = ({
  pylon_id, name, admin_category_price, tiles_name, admin_tiles_price, sort_order, is_active,
}) =>
  db.execute(
    `INSERT INTO pylon_categories
       (pylon_id, name, admin_category_price, tiles_name, admin_tiles_price, sort_order, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      pylon_id,
      name,
      admin_category_price ?? 0,
      tiles_name,
      admin_tiles_price ?? 0,
      sort_order || 0,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
    ]
  );

const updateCategory = (id, fields) => {
  const allowed = ['name', 'admin_category_price', 'tiles_name', 'admin_tiles_price', 'sort_order', 'is_active'];
  const sets = [];
  const values = [];
  allowed.forEach((key) => {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`);
      values.push(key === 'is_active' ? (fields[key] ? 1 : 0) : fields[key]);
    }
  });
  if (!sets.length) return Promise.resolve(null);
  values.push(id);
  return db.execute(`UPDATE pylon_categories SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
};

const removeCategory = (id) => db.execute('DELETE FROM pylon_categories WHERE id = ?', [id]);

const getPublicById = async (id) => {
  const row = await getById(id);
  if (!row || !row.is_active) return null;
  return toPublic(row);
};

const getActiveList = async ({ productTypeId } = {}) => {
  const conditions = ['p.is_active = 1'];
  const values = [];
  if (productTypeId !== undefined) {
    conditions.push('p.product_type_id = ?');
    values.push(productTypeId);
  }
  const rows = await db.execute(
    `SELECT p.*, pt.slug AS product_type_slug
     FROM pylons p
     LEFT JOIN product_types pt ON pt.id = p.product_type_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY p.sort_order ASC, p.id ASC`,
    values
  );
  return Promise.all(rows.map((r) => toPublic(r)));
};

module.exports = {
  getCategories,
  getCategoryById,
  getAll,
  getById,
  toPublic,
  toPublicList,
  create,
  update,
  remove,
  createCategory,
  updateCategory,
  removeCategory,
  getPublicById,
  getActiveList,
};
