const db = require('../config/db');

const ALLOWED_TYPES = ['regular', 'premium', 'prestige'];

const normalizeWallpaperType = (value) => {
  if (value == null || value === '') return 'regular';
  const v = String(value).toLowerCase().trim();
  return ALLOWED_TYPES.includes(v) ? v : 'regular';
};

const getAll = ({ productTypeId, wallpaperType, isActive, offset, limit }) => {
  const conditions = [];
  const values = [];

  if (productTypeId !== undefined) { conditions.push('wp.product_type_id = ?'); values.push(productTypeId); }
  if (wallpaperType !== undefined && wallpaperType !== null && wallpaperType !== '') {
    conditions.push('wp.wallpaper_type = ?');
    values.push(wallpaperType);
  }
  if (isActive      !== undefined) { conditions.push('wp.is_active = ?');       values.push(isActive); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT wp.*, pt.name AS product_type_name, pt.slug AS product_type_slug
    FROM wallpapers wp
    LEFT JOIN product_types pt ON pt.id = wp.product_type_id
    ${where}
    ORDER BY wp.sort_order ASC, wp.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const countSql = `SELECT COUNT(*) AS total FROM wallpapers wp ${where}`;

  return db.paginate(sql, countSql, [...values, limit, offset], values);
};

const getById = (id) =>
  db.findOne(
    `SELECT wp.*, pt.name AS product_type_name
     FROM wallpapers wp
     LEFT JOIN product_types pt ON pt.id = wp.product_type_id
     WHERE wp.id = ?`,
    [id]
  );

const create = ({
  product_type_id,
  name,
  description,
  wallpaper_type,
  thumbnail_url,
  file_url,
  admin_price_per_sqft,
  sort_order,
}) =>
  db.execute(
    `INSERT INTO wallpapers
       (product_type_id, name, description, wallpaper_type, thumbnail_url, file_url, admin_price_per_sqft, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product_type_id,
      name,
      description || null,
      normalizeWallpaperType(wallpaper_type),
      thumbnail_url || null,
      file_url || null,
      admin_price_per_sqft,
      sort_order || 0,
    ]
  );

const update = (id, fields) => {
  const allowed = ['name', 'description', 'wallpaper_type', 'thumbnail_url', 'file_url', 'admin_price_per_sqft', 'sort_order', 'is_active'];
  const sets = [];
  const values = [];

  allowed.forEach((key) => {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`);
      values.push(key === 'wallpaper_type' ? normalizeWallpaperType(fields[key]) : fields[key]);
    }
  });
  if (!sets.length) return Promise.resolve(null);

  values.push(id);
  return db.execute(`UPDATE wallpapers SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
};

const remove = (id) => db.execute('DELETE FROM wallpapers WHERE id = ?', [id]);

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  normalizeWallpaperType,
  ALLOWED_TYPES,
};
