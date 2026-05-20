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

// ── Base Pricing (per sq ft, same pattern as materials) ─────────
const getBasePrice = (vendorId, baseId) =>
  db.findOne('SELECT price_per_sqft FROM vendor_base_pricing WHERE vendor_id = ? AND base_id = ? AND is_active = 1', [vendorId, baseId]);

const upsertBasePrice = (vendorId, baseId, pricePerSqft) =>
  db.execute(
    `INSERT INTO vendor_base_pricing (vendor_id, base_id, price_per_sqft)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE price_per_sqft = ?, updated_at = NOW()`,
    [vendorId, baseId, pricePerSqft, pricePerSqft]
  );

const getAllBasePrices = (vendorId) =>
  db.execute(
    `SELECT
      b.id AS base_id,
      b.product_type_id,
      b.name AS base_name,
      pt.name AS product_type_name,
      vbp.price_per_sqft,
      vbp.is_active
     FROM bases b
     LEFT JOIN product_types pt ON pt.id = b.product_type_id
     LEFT JOIN vendor_base_pricing vbp
       ON vbp.base_id = b.id
      AND vbp.vendor_id = ?
      AND vbp.is_active = 1
     WHERE b.is_active = 1
     ORDER BY b.sort_order ASC, b.id ASC`,
    [vendorId]
  );

// ── Thickness pricing (per sq ft) ───────────────────────────────
const getThicknessPrice = (vendorId, thicknessId) =>
  db.findOne(
    'SELECT price_per_sqft FROM vendor_thickness_pricing WHERE vendor_id = ? AND thickness_id = ? AND is_active = 1',
    [vendorId, thicknessId]
  );

const upsertThicknessPrice = (vendorId, thicknessId, pricePerSqft) =>
  db.execute(
    `INSERT INTO vendor_thickness_pricing (vendor_id, thickness_id, price_per_sqft)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE price_per_sqft = ?, updated_at = NOW()`,
    [vendorId, thicknessId, pricePerSqft, pricePerSqft]
  );

const getAllThicknessPrices = (vendorId) =>
  db.execute(
    `SELECT
      t.id AS thickness_id,
      t.product_type_id,
      t.name AS thickness_name,
      pt.name AS product_type_name,
      vtp.price_per_sqft,
      vtp.is_active
     FROM thicknesses t
     LEFT JOIN product_types pt ON pt.id = t.product_type_id
     LEFT JOIN vendor_thickness_pricing vtp
       ON vtp.thickness_id = t.id
      AND vtp.vendor_id = ?
      AND vtp.is_active = 1
     WHERE t.is_active = 1
     ORDER BY t.sort_order ASC, t.id ASC`,
    [vendorId]
  );

const getAllMaterialPrices = (vendorId) =>
  db.execute(
    `SELECT
      m.id AS material_id,
      m.product_type_id,
      m.name AS material_name,
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

// ── Material style pricing (per sq ft, text-only master) ───────
const getMaterialStylePrice = (vendorId, materialStyleId) =>
  db.findOne(
    'SELECT price_per_sqft FROM vendor_material_style_pricing WHERE vendor_id = ? AND material_style_id = ? AND is_active = 1',
    [vendorId, materialStyleId]
  );

const upsertMaterialStylePrice = (vendorId, materialStyleId, pricePerSqft) =>
  db.execute(
    `INSERT INTO vendor_material_style_pricing (vendor_id, material_style_id, price_per_sqft)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE price_per_sqft = ?, updated_at = NOW()`,
    [vendorId, materialStyleId, pricePerSqft, pricePerSqft]
  );

const getAllMaterialStylePrices = (vendorId) =>
  db.execute(
    `SELECT
      ms.id AS material_style_id,
      ms.product_type_id,
      ms.name AS material_style_name,
      pt.name AS product_type_name,
      vmsp.price_per_sqft,
      vmsp.is_active
     FROM material_styles ms
     LEFT JOIN product_types pt ON pt.id = ms.product_type_id
     LEFT JOIN vendor_material_style_pricing vmsp
       ON vmsp.material_style_id = ms.id
      AND vmsp.vendor_id = ?
      AND vmsp.is_active = 1
     WHERE ms.is_active = 1
     ORDER BY ms.sort_order ASC, ms.id ASC`,
    [vendorId]
  );

// ── Frame pricing (per sq ft, same as materials) ─────────────────
const getFramePrice = (vendorId, frameId) =>
  db.findOne(
    'SELECT price_per_sqft FROM vendor_frame_pricing WHERE vendor_id = ? AND frame_id = ? AND is_active = 1',
    [vendorId, frameId]
  );

const upsertFramePrice = (vendorId, frameId, pricePerSqft) =>
  db.execute(
    `INSERT INTO vendor_frame_pricing (vendor_id, frame_id, price_per_sqft)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE price_per_sqft = ?, updated_at = NOW()`,
    [vendorId, frameId, pricePerSqft, pricePerSqft]
  );

const getAllFramePrices = (vendorId) =>
  db.execute(
    `SELECT
      fr.id AS frame_id,
      fr.product_type_id,
      fr.name AS frame_name,
      pt.name AS product_type_name,
      vfp.price_per_sqft,
      vfp.is_active
     FROM frames fr
     LEFT JOIN product_types pt ON pt.id = fr.product_type_id
     LEFT JOIN vendor_frame_pricing vfp
       ON vfp.frame_id = fr.id
      AND vfp.vendor_id = ?
      AND vfp.is_active = 1
     WHERE fr.is_active = 1
     ORDER BY fr.sort_order ASC, fr.id ASC`,
    [vendorId]
  );

// ── Wallpaper pricing (per sq ft, same as frames) ───────────────
const getWallpaperPrice = (vendorId, wallpaperId) =>
  db.findOne(
    'SELECT price_per_sqft FROM vendor_wallpaper_pricing WHERE vendor_id = ? AND wallpaper_id = ? AND is_active = 1',
    [vendorId, wallpaperId]
  );

const upsertWallpaperPrice = (vendorId, wallpaperId, pricePerSqft) =>
  db.execute(
    `INSERT INTO vendor_wallpaper_pricing (vendor_id, wallpaper_id, price_per_sqft)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE price_per_sqft = ?, updated_at = NOW()`,
    [vendorId, wallpaperId, pricePerSqft, pricePerSqft]
  );

const getAllWallpaperPrices = (vendorId) =>
  db.execute(
    `SELECT
      wp.id AS wallpaper_id,
      wp.product_type_id,
      wp.name AS wallpaper_name,
      wp.wallpaper_type,
      pt.name AS product_type_name,
      vwp.price_per_sqft,
      vwp.is_active
     FROM wallpapers wp
     LEFT JOIN product_types pt ON pt.id = wp.product_type_id
     LEFT JOIN vendor_wallpaper_pricing vwp
       ON vwp.wallpaper_id = wp.id
      AND vwp.vendor_id = ?
      AND vwp.is_active = 1
     WHERE wp.is_active = 1
     ORDER BY wp.sort_order ASC, wp.id ASC`,
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

// ── Add Border (flat + lit add-on) ───────────────────────────────
const getAddBorderPrice = (vendorId, addBorderId) =>
  db.findOne(
    'SELECT price, lit_price FROM vendor_add_border_pricing WHERE vendor_id = ? AND add_border_id = ? AND is_active = 1',
    [vendorId, addBorderId]
  );

const upsertAddBorderPrice = (vendorId, addBorderId, price, litPrice) =>
  db.execute(
    `INSERT INTO vendor_add_border_pricing (vendor_id, add_border_id, price, lit_price)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE price = ?, lit_price = ?, updated_at = NOW()`,
    [vendorId, addBorderId, price, litPrice, price, litPrice]
  );

const getAllAddBorderPrices = (vendorId) =>
  db.execute(
    `SELECT
      ab.id AS add_border_id,
      ab.product_type_id,
      ab.shape,
      ab.size,
      ab.height AS add_border_height,
      ab.width AS add_border_width,
      pt.name AS product_type_name,
      vab.price,
      vab.lit_price
     FROM add_borders ab
     LEFT JOIN product_types pt ON pt.id = ab.product_type_id
     LEFT JOIN vendor_add_border_pricing vab
       ON vab.add_border_id = ab.id AND vab.vendor_id = ? AND vab.is_active = 1
     WHERE ab.is_active = 1
     ORDER BY ab.sort_order ASC, ab.shape ASC, ab.size ASC`,
    [vendorId]
  );

// ── Lollipop element (flat) ────────────────────────────────────
const getLollipopElementPrice = (vendorId, lollipopElementId) =>
  db.findOne(
    'SELECT price FROM vendor_lollipop_element_pricing WHERE vendor_id = ? AND lollipop_element_id = ? AND is_active = 1',
    [vendorId, lollipopElementId]
  );

const upsertLollipopElementPrice = (vendorId, lollipopElementId, price) =>
  db.execute(
    `INSERT INTO vendor_lollipop_element_pricing (vendor_id, lollipop_element_id, price)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE price = ?, updated_at = NOW()`,
    [vendorId, lollipopElementId, price, price]
  );

const getAllLollipopElementPrices = (vendorId) =>
  db.execute(
    `SELECT
      le.id AS lollipop_element_id,
      le.product_type_id,
      le.name AS lollipop_element_name,
      le.description AS lollipop_element_description,
      le.file_url AS lollipop_element_image,
      le.thumbnail_url AS lollipop_element_thumbnail_url,
      le.admin_price AS admin_price,
      pt.name AS product_type_name,
      vle.price
     FROM lollipop_elements le
     LEFT JOIN product_types pt ON pt.id = le.product_type_id
     LEFT JOIN vendor_lollipop_element_pricing vle
       ON vle.lollipop_element_id = le.id AND vle.vendor_id = ? AND vle.is_active = 1
     WHERE le.is_active = 1
     ORDER BY le.sort_order ASC, le.name ASC`,
    [vendorId]
  );

module.exports = {
  getBasePrice, upsertBasePrice, getAllBasePrices,
  getThicknessPrice, upsertThicknessPrice, getAllThicknessPrices,
  getMaterialPrice, upsertMaterialPrice, getAllMaterialPrices,
  getMaterialStylePrice, upsertMaterialStylePrice, getAllMaterialStylePrices,
  getFramePrice, upsertFramePrice, getAllFramePrices,
  getWallpaperPrice, upsertWallpaperPrice, getAllWallpaperPrices,
  getElementPrice,  upsertElementPrice,  getAllElementPrices,
  getColorPrice,    upsertColorPrice,
  getAllFontPrices, upsertFontPrice,
  getIlluminationPrice, upsertIlluminationPrice, getAllIlluminationPrices,
  getAddBorderPrice, upsertAddBorderPrice, getAllAddBorderPrices,
  getLollipopElementPrice, upsertLollipopElementPrice, getAllLollipopElementPrices,
};
