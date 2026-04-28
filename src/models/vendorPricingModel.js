const db = require('../config/db');

// ── Material Pricing ─────────────────────────────
const getMaterialPrice = (vendorId, materialId) =>
  db.findOne('SELECT price_per_sqft FROM vendor_material_pricing WHERE vendor_id = ? AND material_id = ? AND is_active = 1', [vendorId, materialId]);

const upsertMaterialPrice = (vendorId, materialId, pricePerSqft) =>
  db.execute(
    `INSERT INTO vendor_material_pricing (vendor_id, material_id, price_per_sqft)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE price_per_sqft = ?, updated_at = NOW()`,
    [vendorId, materialId, pricePerSqft, pricePerSqft]
  );

const getAllMaterialPrices = (vendorId) =>
  db.execute(
    `SELECT
      m.id AS material_id,
      m.product_type_id,
      m.name AS material_name,
      m.admin_price_per_sqft,
      pt.name AS product_type_name,
      vmp.price_per_sqft,
      vmp.is_active
     FROM materials m
     LEFT JOIN product_types pt ON pt.id = m.product_type_id
     LEFT JOIN vendor_material_pricing vmp
       ON vmp.material_id = m.id
      AND vmp.vendor_id = ?
      AND vmp.is_active = 1
     WHERE m.is_active = 1
     ORDER BY m.sort_order ASC, m.id ASC`,
    [vendorId]
  );

// ── Element Pricing ──────────────────────────────
const getElementPrice = (vendorId, elementId) =>
  db.findOne('SELECT price_extra FROM vendor_element_pricing WHERE vendor_id = ? AND element_id = ? AND is_active = 1', [vendorId, elementId]);

const upsertElementPrice = (vendorId, elementId, priceExtra) =>
  db.execute(
    `INSERT INTO vendor_element_pricing (vendor_id, element_id, price_extra)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE price_extra = ?`,
    [vendorId, elementId, priceExtra, priceExtra]
  );

const getAllElementPrices = (vendorId) =>
  db.execute(
    `SELECT
      e.id AS element_id,
      e.product_type_id,
      e.name AS element_name,
      e.admin_price_extra,
      pt.name AS product_type_name,
      vep.price_extra,
      vep.is_active
     FROM elements e
     LEFT JOIN product_types pt ON pt.id = e.product_type_id
     LEFT JOIN vendor_element_pricing vep
       ON vep.element_id = e.id
      AND vep.vendor_id = ?
      AND vep.is_active = 1
     WHERE e.is_active = 1
     ORDER BY e.sort_order ASC, e.id ASC`,
    [vendorId]
  );

// ── Color Pricing ────────────────────────────────
const getColorPrice = (vendorId, colorId) =>
  db.findOne('SELECT price_extra FROM vendor_color_pricing WHERE vendor_id = ? AND color_id = ? AND is_active = 1', [vendorId, colorId]);

const upsertColorPrice = (vendorId, colorId, priceExtra) =>
  db.execute(
    `INSERT INTO vendor_color_pricing (vendor_id, color_id, price_extra)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE price_extra = ?`,
    [vendorId, colorId, priceExtra, priceExtra]
  );

// ── Font Pricing (Product Type based) ─────────────────────────
const getAllFontPrices = (vendorId, productTypeId) => {
  const conds = ['ftp.is_active = 1', 'f.is_active = 1'];
  const vals = [vendorId];
  if (productTypeId !== undefined) {
    conds.push('ftp.product_type_id = ?');
    vals.push(productTypeId);
  }
  return db.execute(
    `SELECT
      ftp.font_id,
      ftp.product_type_id,
      f.name AS font_name,
      ftp.admin_price_extra,
      pt.name AS product_type_name,
      vfp.price_extra
     FROM font_product_type_pricing ftp
     INNER JOIN fonts f ON f.id = ftp.font_id
     INNER JOIN product_types pt ON pt.id = ftp.product_type_id
     LEFT JOIN vendor_font_pricing vfp
       ON vfp.vendor_id = ?
      AND vfp.font_id = ftp.font_id
      AND vfp.product_type_id = ftp.product_type_id
      AND vfp.is_active = 1
     WHERE ${conds.join(' AND ')}
     ORDER BY f.sort_order ASC, ftp.product_type_id ASC`,
    vals
  );
};

const upsertFontPrice = (vendorId, fontId, productTypeId, priceExtra) =>
  db.execute(
    `INSERT INTO vendor_font_pricing (vendor_id, font_id, product_type_id, price_extra)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE price_extra = ?, is_active = 1, updated_at = NOW()`,
    [vendorId, fontId, productTypeId, priceExtra, priceExtra]
  );

// ── Illumination (Lit / Non-Lit) per sq ft ──────────────────────
const getIlluminationPrice = (vendorId, illuminationOptionId) =>
  db.findOne(
    'SELECT price_per_sqft FROM vendor_illumination_pricing WHERE vendor_id = ? AND illumination_option_id = ? AND is_active = 1',
    [vendorId, illuminationOptionId]
  );

const upsertIlluminationPrice = (vendorId, illuminationOptionId, pricePerSqft) =>
  db.execute(
    `INSERT INTO vendor_illumination_pricing (vendor_id, illumination_option_id, price_per_sqft)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE price_per_sqft = ?, is_active = 1, updated_at = NOW()`,
    [vendorId, illuminationOptionId, pricePerSqft, pricePerSqft]
  );

const getAllIlluminationPrices = (vendorId, productTypeId) => {
  const conds = ['io.is_active = 1'];
  const vals = [vendorId];
  if (productTypeId !== undefined && productTypeId !== null && productTypeId !== '') {
    conds.push('io.product_type_id = ?');
    vals.push(productTypeId);
  }
  return db.execute(
    `SELECT
      io.id AS illumination_option_id,
      io.product_type_id,
      io.category,
      io.name AS option_name,
      io.description,
      io.preview_image_url,
      io.admin_price_per_sqft,
      pt.name AS product_type_name,
      vip.price_per_sqft
     FROM illumination_options io
     INNER JOIN product_types pt ON pt.id = io.product_type_id
     LEFT JOIN vendor_illumination_pricing vip
       ON vip.illumination_option_id = io.id
      AND vip.vendor_id = ?
      AND vip.is_active = 1
     WHERE ${conds.join(' AND ')}
     ORDER BY io.product_type_id ASC, io.category ASC, io.sort_order ASC, io.id ASC`,
    vals
  );
};

module.exports = {
  getMaterialPrice, upsertMaterialPrice, getAllMaterialPrices,
  getElementPrice,  upsertElementPrice,  getAllElementPrices,
  getColorPrice,    upsertColorPrice,
  getAllFontPrices, upsertFontPrice,
  getIlluminationPrice, upsertIlluminationPrice, getAllIlluminationPrices,
};
