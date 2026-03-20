const db = require('../config/db');

const getAll = (isActive) => {
  const where = isActive !== undefined ? 'WHERE is_active = ?' : '';
  return db.execute(`SELECT * FROM product_types ${where} ORDER BY sort_order ASC`, isActive !== undefined ? [isActive] : []);
};
const getById   = (id)   => db.findOne('SELECT * FROM product_types WHERE id = ?', [id]);
const getBySlug = (slug) => db.findOne('SELECT * FROM product_types WHERE slug = ?', [slug]);
const update    = (id, { is_active, thumbnail_url, description }) =>
  db.execute('UPDATE product_types SET is_active = COALESCE(?, is_active), thumbnail_url = COALESCE(?, thumbnail_url), description = COALESCE(?, description) WHERE id = ?',
    [is_active ?? null, thumbnail_url ?? null, description ?? null, id]);

module.exports = { getAll, getById, getBySlug, update };
