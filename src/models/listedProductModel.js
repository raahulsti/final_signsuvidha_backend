const db = require('../config/db');
const { LISTED_PRODUCT_SIZES } = require('../utils/constants');

const getImages = (productId) =>
  db.execute(
    'SELECT id, listed_product_id, file_url, sort_order FROM listed_product_images WHERE listed_product_id = ? ORDER BY sort_order ASC, id ASC',
    [productId]
  );

const getVariants = (productId, { activeOnly = false } = {}) => {
  const cond = activeOnly ? ' AND is_active = 1' : '';
  return db.execute(
    `SELECT id, listed_product_id, size, admin_price, height, width, is_active FROM listed_product_variants WHERE listed_product_id = ?${cond} ORDER BY FIELD(size, 'regular','medium','large')`,
    [productId]
  );
};

const toPublic = async (row) => {
  if (!row) return null;
  const [images, variants] = await Promise.all([
    getImages(row.id),
    getVariants(row.id, { activeOnly: true }),
  ]);
  const prices = variants.map((v) => ({
    size: v.size,
    admin_price: parseFloat(v.admin_price || 0),
    height: v.height || null,
    width: v.width || null,
  }));
  const priceFrom = prices.length ? Math.min(...prices.map((p) => p.admin_price)) : 0;
  return {
    id: row.id,
    product_type_id: row.product_type_id,
    name: row.name,
    description: row.description,
    is_best_seller: !!row.is_best_seller,
    sort_order: row.sort_order,
    is_active: !!row.is_active,
    images: images.map((i) => i.file_url),
    image_rows: images.map((i) => ({ id: i.id, file_url: i.file_url, sort_order: i.sort_order })),
    thumbnail_url: images[0]?.file_url || row.thumbnail_url || null,
    variants: prices,
    price_from: priceFrom,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const getAll = async ({ activeOnly, productTypeId } = {}) => {
  const conds = [];
  const vals = [];
  if (activeOnly) { conds.push('is_active = 1'); }
  if (productTypeId) { conds.push('product_type_id = ?'); vals.push(productTypeId); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const rows = await db.execute(
    `SELECT * FROM listed_products ${where} ORDER BY sort_order ASC, is_best_seller DESC, id ASC`,
    vals
  );
  return Promise.all(rows.map(toPublic));
};

const getById = (id) => db.findOne('SELECT * FROM listed_products WHERE id = ?', [id]);

const getPublicById = async (id) => {
  const row = await getById(id);
  if (!row || !row.is_active) return null;
  return toPublic(row);
};

const create = async ({ product_type_id, name, description, is_best_seller, sort_order, is_active, variants }) => {
  const result = await db.execute(
    `INSERT INTO listed_products (product_type_id, name, description, admin_price, is_best_seller, sort_order, is_active)
     VALUES (?, ?, ?, 0, ?, ?, ?)`,
    [product_type_id, name, description || null, is_best_seller ? 1 : 0, sort_order || 0, is_active !== false ? 1 : 0]
  );
  const productId = result.insertId;
  await upsertVariants(productId, variants);
  return productId;
};

const normalizeDim = (v) => {
  if (v == null || v === '') return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

const upsertVariants = async (productId, variants = []) => {
  for (const entry of variants) {
    if (!entry?.size || !LISTED_PRODUCT_SIZES.includes(entry.size)) continue;
    const price = parseFloat(entry.admin_price ?? 0);
    const isActive = entry.is_active !== false ? 1 : 0;
    const height = normalizeDim(entry.height);
    const width = normalizeDim(entry.width);
    await db.execute(
      `INSERT INTO listed_product_variants (listed_product_id, size, admin_price, height, width, is_active)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE admin_price = VALUES(admin_price), height = VALUES(height), width = VALUES(width), is_active = VALUES(is_active), updated_at = NOW()`,
      [productId, entry.size, price, height, width, isActive]
    );
  }
};

/** Remove a size tier when admin clears that price on update. */
const removeVariant = (productId, size) =>
  db.execute('DELETE FROM listed_product_variants WHERE listed_product_id = ? AND size = ?', [productId, size]);

const addImages = async (productId, urls = []) => {
  let order = 0;
  const existing = await getImages(productId);
  order = existing.length;
  for (const url of urls) {
    if (!url) continue;
    await db.execute(
      'INSERT INTO listed_product_images (listed_product_id, file_url, sort_order) VALUES (?, ?, ?)',
      [productId, url, order++]
    );
  }
  await syncThumbnail(productId);
};

const syncThumbnail = async (productId) => {
  const imgs = await getImages(productId);
  const thumb = imgs[0]?.file_url || null;
  await db.execute('UPDATE listed_products SET thumbnail_url = ? WHERE id = ?', [thumb, productId]);
};

const removeImages = async (imageIds = []) => {
  if (!imageIds.length) return;
  const placeholders = imageIds.map(() => '?').join(',');
  const rows = await db.execute(
    `SELECT listed_product_id FROM listed_product_images WHERE id IN (${placeholders})`,
    imageIds
  );
  await db.execute(`DELETE FROM listed_product_images WHERE id IN (${placeholders})`, imageIds);
  const productIds = [...new Set(rows.map((r) => r.listed_product_id))];
  await Promise.all(productIds.map(syncThumbnail));
};

const update = async (id, fields) => {
  const allowed = ['name', 'description', 'is_best_seller', 'sort_order', 'is_active', 'product_type_id'];
  const sets = [];
  const values = [];
  allowed.forEach((k) => {
    if (fields[k] !== undefined) {
      sets.push(`${k} = ?`);
      let v = fields[k];
      if (k === 'is_best_seller' || k === 'is_active') v = v ? 1 : 0;
      values.push(v);
    }
  });
  if (sets.length) {
    values.push(id);
    await db.execute(`UPDATE listed_products SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
  }
  if (fields.variants) await upsertVariants(id, fields.variants);
};

const remove = async (id) => {
  await db.execute('DELETE FROM listed_product_images WHERE listed_product_id = ?', [id]);
  await db.execute('DELETE FROM listed_product_variants WHERE listed_product_id = ?', [id]);
  return db.execute('DELETE FROM listed_products WHERE id = ?', [id]);
};

const getVariantPrice = async (productId, size) => {
  const row = await db.findOne(
    `SELECT v.admin_price, p.is_active AS product_active, v.is_active AS variant_active, p.product_type_id, p.name
     FROM listed_product_variants v
     INNER JOIN listed_products p ON p.id = v.listed_product_id
     WHERE v.listed_product_id = ? AND v.size COLLATE utf8mb4_unicode_ci = ?`,
    [productId, size]
  );
  if (!row || !row.product_active || !row.variant_active) return null;
  return row;
};

module.exports = {
  getAll,
  getById,
  getPublicById,
  toPublic,
  create,
  update,
  remove,
  getImages,
  getVariants,
  addImages,
  removeImages,
  upsertVariants,
  getVariantPrice,
  removeVariant,
};
