const db = require('../config/db');

const getAll = (productTypeId) => {
  if (productTypeId) {
    return db.execute(
      `SELECT
         f.*,
         ftp.admin_price_extra,
         ftp.product_type_id
       FROM fonts f
       INNER JOIN font_product_type_pricing ftp
         ON ftp.font_id = f.id
        AND ftp.product_type_id = ?
        AND ftp.is_active = 1
       WHERE f.is_active = 1
       ORDER BY f.sort_order ASC`,
      [productTypeId]
    );
  }
  return db.execute(
    `SELECT
      f.*,
      GROUP_CONCAT(DISTINCT ftp.product_type_id) AS product_type_ids_csv,
      GROUP_CONCAT(
        DISTINCT CONCAT(ftp.product_type_id, ':', ftp.admin_price_extra)
        ORDER BY ftp.product_type_id SEPARATOR ','
      ) AS product_type_prices_csv
     FROM fonts f
     LEFT JOIN font_product_type_pricing ftp ON ftp.font_id = f.id
     WHERE f.is_active = 1
     GROUP BY f.id
     ORDER BY f.sort_order ASC`
  );
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

const replaceProductTypePrices = async (fontId, productTypePrices) => {
  await db.execute('DELETE FROM font_product_type_pricing WHERE font_id = ?', [fontId]);
  await db.execute('DELETE FROM product_type_fonts WHERE font_id = ?', [fontId]);
  if (!productTypePrices?.length) return;

  const dedup = new Map();
  productTypePrices.forEach((item) => {
    const ptId = Number(item.product_type_id);
    if (!Number.isFinite(ptId)) return;
    dedup.set(ptId, {
      product_type_id: ptId,
      admin_price_extra: Number(item.admin_price_extra || 0),
      is_active: item.is_active === undefined ? 1 : Number(Boolean(item.is_active)),
    });
  });
  const rows = Array.from(dedup.values());
  if (!rows.length) return;

  await db.query(
    `INSERT INTO font_product_type_pricing
      (font_id, product_type_id, admin_price_extra, is_active)
     VALUES ?`,
    [rows.map((r) => [fontId, r.product_type_id, r.admin_price_extra, r.is_active])]
  );
  await db.query(
    'INSERT INTO product_type_fonts (product_type_id, font_id) VALUES ?',
    [rows.map((r) => [r.product_type_id, fontId])]
  );
};

module.exports = { getAll, getById, create, update, remove, assignProducts, replaceProductTypePrices };
