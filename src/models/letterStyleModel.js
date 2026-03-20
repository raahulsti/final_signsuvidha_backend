const db = require('../config/db');

const getAll = (productTypeId) => {
  const where = productTypeId ? 'WHERE product_type_id = ? AND is_active = 1' : 'WHERE is_active = 1';
  const vals  = productTypeId ? [productTypeId] : [];
  return db.execute(`SELECT * FROM letter_styles ${where}`, vals);
};

const getById = (id) => db.findOne('SELECT * FROM letter_styles WHERE id = ?', [id]);

const create = ({ product_type_id, name, preview_image_url, price_multiplier, admin_price_extra }) =>
  db.execute(
    'INSERT INTO letter_styles (product_type_id, name, preview_image_url, price_multiplier, admin_price_extra) VALUES (?, ?, ?, ?, ?)',
    [product_type_id, name, preview_image_url || null, price_multiplier || 1.00, admin_price_extra || 0]
  );

const update = (id, fields) => {
  const allowed = ['name','preview_image_url','price_multiplier','admin_price_extra','is_active'];
  const sets = []; const values = [];
  allowed.forEach((k) => { if (fields[k] !== undefined) { sets.push(`${k} = ?`); values.push(fields[k]); } });
  if (!sets.length) return Promise.resolve(null);
  values.push(id);
  return db.execute(`UPDATE letter_styles SET ${sets.join(', ')} WHERE id = ?`, values);
};

const remove = (id) => db.execute('DELETE FROM letter_styles WHERE id = ?', [id]);

module.exports = { getAll, getById, create, update, remove };
