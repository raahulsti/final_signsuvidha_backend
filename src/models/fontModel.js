const db = require('../config/db');

const getAll = (productTypeId) => {
  if (productTypeId) {
    return db.execute(
      `SELECT f.* FROM fonts f
       INNER JOIN product_type_fonts ptf ON ptf.font_id = f.id
       WHERE ptf.product_type_id = ? AND f.is_active = 1
       ORDER BY f.sort_order ASC`,
      [productTypeId]
    );
  }
  return db.execute('SELECT * FROM fonts WHERE is_active = 1 ORDER BY sort_order ASC');
};

const getById   = (id) => db.findOne('SELECT * FROM fonts WHERE id = ?', [id]);

const create = ({ name, file_url, preview_url, sort_order }) =>
  db.execute('INSERT INTO fonts (name, file_url, preview_url, sort_order) VALUES (?, ?, ?, ?)',
    [name, file_url || null, preview_url || null, sort_order || 0]);

const update = (id, fields) => {
  const allowed = ['name','file_url','preview_url','sort_order','is_active'];
  const sets = []; const values = [];
  allowed.forEach((k) => { if (fields[k] !== undefined) { sets.push(`${k} = ?`); values.push(fields[k]); } });
  if (!sets.length) return Promise.resolve(null);
  values.push(id);
  return db.execute(`UPDATE fonts SET ${sets.join(', ')} WHERE id = ?`, values);
};

const remove = (id) => db.execute('DELETE FROM fonts WHERE id = ?', [id]);

const assignProducts = async (fontId, productTypeIds) => {
  await db.execute('DELETE FROM product_type_fonts WHERE font_id = ?', [fontId]);
  if (!productTypeIds?.length) return;
  const rows = productTypeIds.map((ptId) => [ptId, fontId]);
  await db.query('INSERT INTO product_type_fonts (product_type_id, font_id) VALUES ?', [rows]);
};

module.exports = { getAll, getById, create, update, remove, assignProducts };
