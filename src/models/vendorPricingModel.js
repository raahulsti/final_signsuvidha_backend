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
    `SELECT vmp.*, m.name AS material_name, m.admin_price_per_sqft, pt.name AS product_type_name
     FROM vendor_material_pricing vmp
     LEFT JOIN materials m ON m.id = vmp.material_id
     LEFT JOIN product_types pt ON pt.id = m.product_type_id
     WHERE vmp.vendor_id = ?`,
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
    `SELECT vep.*, e.name AS element_name, e.admin_price_extra
     FROM vendor_element_pricing vep
     LEFT JOIN elements e ON e.id = vep.element_id
     WHERE vep.vendor_id = ?`,
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

// ── Letter Style Pricing ─────────────────────────
const getLetterStylePrice = (vendorId, letterStyleId) =>
  db.findOne('SELECT price_multiplier, price_extra FROM vendor_letter_style_pricing WHERE vendor_id = ? AND letter_style_id = ?', [vendorId, letterStyleId]);

const upsertLetterStylePrice = (vendorId, letterStyleId, priceMultiplier, priceExtra) =>
  db.execute(
    `INSERT INTO vendor_letter_style_pricing (vendor_id, letter_style_id, price_multiplier, price_extra)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE price_multiplier = ?, price_extra = ?`,
    [vendorId, letterStyleId, priceMultiplier, priceExtra, priceMultiplier, priceExtra]
  );

module.exports = {
  getMaterialPrice, upsertMaterialPrice, getAllMaterialPrices,
  getElementPrice,  upsertElementPrice,  getAllElementPrices,
  getColorPrice,    upsertColorPrice,
  getLetterStylePrice, upsertLetterStylePrice,
};
