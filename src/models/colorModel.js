const db = require('../config/db');

const getAll = (productTypeId) => {
  if (productTypeId) {
    return db.execute(
      `SELECT c.*, GROUP_CONCAT(DISTINCT ptc.product_type_id) AS product_type_ids_csv
       FROM colors c
       INNER JOIN product_type_colors ptc ON ptc.color_id = c.id
       WHERE ptc.product_type_id = ? AND c.is_active = 1
       GROUP BY c.id
       ORDER BY c.id ASC`,
      [productTypeId]
    );
  }
  return db.execute(
    `SELECT c.*, GROUP_CONCAT(DISTINCT ptc.product_type_id) AS product_type_ids_csv
     FROM colors c
     LEFT JOIN product_type_colors ptc ON ptc.color_id = c.id
     GROUP BY c.id
     ORDER BY c.id ASC`
  );
};

const getById = (id) => db.findOne('SELECT * FROM colors WHERE id = ?', [id]);

const create = ({ name, hex_code, admin_price_extra }) =>
  db.execute('INSERT INTO colors (name, hex_code, admin_price_extra) VALUES (?, ?, ?)',
    [name || null, hex_code, admin_price_extra || 0]);

const update = (id, fields) => {
  const allowed = ['name','hex_code','admin_price_extra','is_active'];
  const sets = []; const values = [];
  allowed.forEach((k) => { if (fields[k] !== undefined) { sets.push(`${k} = ?`); values.push(fields[k]); } });
  if (!sets.length) return Promise.resolve(null);
  values.push(id);
  return db.execute(`UPDATE colors SET ${sets.join(', ')} WHERE id = ?`, values);
};

const remove = (id) => db.execute('DELETE FROM colors WHERE id = ?', [id]);

const assignProducts = async (colorId, productTypeIds) => {
  await db.execute('DELETE FROM product_type_colors WHERE color_id = ?', [colorId]);
  if (!productTypeIds?.length) return;
  const rows = productTypeIds.map((ptId) => [ptId, colorId]);
  await db.query('INSERT INTO product_type_colors (product_type_id, color_id) VALUES ?', [rows]);
};

module.exports = { getAll, getById, create, update, remove, assignProducts };
