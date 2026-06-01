const db = require('../config/db');
const vendorPricingModel = require('../models/vendorPricingModel');
const vendorModel = require('../models/vendorModel');
const { LOLLIPOP_PRODUCT_TYPE_ID, PRODUCT_SLUGS } = require('../utils/constants');

const isLollipopItem = (item) =>
  String(item.product_type_id) === String(LOLLIPOP_PRODUCT_TYPE_ID)
  || item.product_type_slug === PRODUCT_SLUGS.LOLLIPOP_SIGN;

const isPylonItem = (item) =>
  item.product_type_slug === PRODUCT_SLUGS.PYLON_SIGN
  || !!item.pylon_id;

const isListedItem = (item) => !!item.listed_product_id;

const is3DSignageItem = (item) => item.product_type_slug === PRODUCT_SLUGS.SIGNAGE_3D;

/** Parse a dimension array that may arrive as a JSON string (from DB) or an array. */
const parseDimensionArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }
  return [];
};

/** Sum of height×width (each converted by its own unit) across a dimension array. */
const sumDimensionAreaSqft = async (entries) => {
  const list = parseDimensionArray(entries);
  let total = 0;
  for (const entry of list) {
    total += await computeAreaSqft(entry.height, entry.width, entry.unit);
  }
  return total;
};

const calculateListedProductPrice = async (item) => {
  const listedProductModel = require('../models/listedProductModel');
  const qty = parseInt(item.quantity, 10) || 1;
  const variant = await listedProductModel.getVariantPrice(item.listed_product_id, item.listed_product_size);
  if (!variant) {
    const err = new Error('Listed product variant not found or inactive');
    err.statusCode = 400;
    throw err;
  }
  const unitPrice = parseFloat(variant.admin_price || 0);
  const totalPrice = parseFloat((unitPrice * qty).toFixed(2));
  return {
    area_sqft: 0,
    price_per_sqft: 0,
    material_cost: 0,
    material_style_price_per_sqft: 0,
    material_style_cost: 0,
    frame_price_per_sqft: 0,
    frame_cost: 0,
    wallpaper_price_per_sqft: 0,
    wallpaper_cost: 0,
    add_border_base_price: 0,
    add_border_lit_extra: 0,
    add_border_cost: 0,
    lollipop_element_cost: 0,
    base_price_per_sqft: 0,
    base_cost: 0,
    thickness_price_per_sqft: 0,
    thickness_cost: 0,
    element_cost: 0,
    color_extra: 0,
    font_extra: 0,
    illumination_cost: 0,
    illumination_rate_per_sqft: 0,
    unit_price: unitPrice,
    quantity: qty,
    total_price: totalPrice,
    listed_product_name: variant.name,
  };
};

const isTruthyLit = (v) => v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true';

/** Lollipop sign: fixed border + optional element + color (no area / dimension pricing). */
const calculateLollipopSignPrice = async (item, vendorId = null) => {
  const {
    add_border_id,
    border_is_lit,
    lollipop_element_id,
    color_id,
    quantity = 1,
  } = item;

  let addBorderBasePrice = 0;
  let addBorderLitExtra = 0;
  if (add_border_id) {
    const ab = await db.findOne(
      'SELECT admin_price, lit_price, product_type_id FROM add_borders WHERE id = ? AND is_active = 1',
      [add_border_id]
    );
    if (ab && String(ab.product_type_id) === String(item.product_type_id)) {
      addBorderBasePrice = parseFloat(ab.admin_price || 0);
      const adminLitExtra = parseFloat(ab.lit_price || 0);
      if (vendorId) {
        const vp = await vendorPricingModel.getAddBorderPrice(vendorId, add_border_id);
        if (vp) {
          addBorderBasePrice = parseFloat(vp.price);
          if (isTruthyLit(border_is_lit)) addBorderLitExtra = parseFloat(vp.lit_price || 0);
        } else if (isTruthyLit(border_is_lit)) {
          addBorderLitExtra = adminLitExtra;
        }
      } else if (isTruthyLit(border_is_lit)) {
        addBorderLitExtra = adminLitExtra;
      }
    }
  }
  const addBorderCost = parseFloat((addBorderBasePrice + addBorderLitExtra).toFixed(2));

  let lollipopElementCost = 0;
  if (lollipop_element_id) {
    const le = await db.findOne(
      'SELECT admin_price, product_type_id FROM lollipop_elements WHERE id = ? AND is_active = 1',
      [lollipop_element_id]
    );
    if (le && String(le.product_type_id) === String(item.product_type_id)) {
      lollipopElementCost = parseFloat(le.admin_price || 0);
      if (vendorId) {
        const vp = await vendorPricingModel.getLollipopElementPrice(vendorId, lollipop_element_id);
        if (vp) lollipopElementCost = parseFloat(vp.price);
      }
    }
  }

  let colorExtra = 0;
  if (color_id) {
    const color = await db.findOne('SELECT admin_price_extra FROM colors WHERE id = ?', [color_id]);
    colorExtra = parseFloat(color?.admin_price_extra || 0);
    if (vendorId) {
      const vp = await vendorPricingModel.getColorPrice(vendorId, color_id);
      if (vp) colorExtra = parseFloat(vp.price_extra);
    }
  }

  const unitPrice = parseFloat((addBorderCost + lollipopElementCost + colorExtra).toFixed(2));
  const totalPrice = parseFloat((unitPrice * quantity).toFixed(2));

  return {
    area_sqft: 0,
    price_per_sqft: 0,
    material_cost: 0,
    material_style_price_per_sqft: 0,
    material_style_cost: 0,
    frame_price_per_sqft: 0,
    frame_cost: 0,
    wallpaper_price_per_sqft: 0,
    wallpaper_cost: 0,
    base_price_per_sqft: 0,
    base_cost: 0,
    thickness_price_per_sqft: 0,
    thickness_cost: 0,
    element_cost: 0,
    add_border_base_price: parseFloat(addBorderBasePrice.toFixed(2)),
    add_border_lit_extra: parseFloat(addBorderLitExtra.toFixed(2)),
    add_border_cost: addBorderCost,
    lollipop_element_cost: parseFloat(lollipopElementCost.toFixed(2)),
    color_extra: parseFloat(colorExtra.toFixed(2)),
    font_extra: 0,
    illumination_cost: 0,
    illumination_rate_per_sqft: 0,
    unit_price: unitPrice,
    quantity: parseInt(quantity, 10),
    total_price: totalPrice,
  };
};

/** Pylon sign: category flat price + (tiles count × tile unit price). */
const calculatePylonSignPrice = async (item, vendorId = null) => {
  const { pylon_category_id, pylon_tiles_count, quantity = 1 } = item;
  const tilesCount = Math.max(0, parseInt(pylon_tiles_count, 10) || 0);

  let categoryPrice = 0;
  let tilesUnitPrice = 0;

  if (pylon_category_id) {
    const cat = await db.findOne(
      `SELECT pc.admin_category_price, pc.admin_tiles_price, pc.pylon_id, py.product_type_id
       FROM pylon_categories pc
       INNER JOIN pylons py ON py.id = pc.pylon_id
       WHERE pc.id = ? AND pc.is_active = 1 AND py.is_active = 1`,
      [pylon_category_id]
    );
    if (cat && String(cat.product_type_id) === String(item.product_type_id)) {
      categoryPrice = parseFloat(cat.admin_category_price || 0);
      tilesUnitPrice = parseFloat(cat.admin_tiles_price || 0);
      if (vendorId) {
        const vp = await vendorPricingModel.getPylonCategoryPrice(vendorId, pylon_category_id);
        if (vp) {
          categoryPrice = parseFloat(vp.category_price);
          tilesUnitPrice = parseFloat(vp.tiles_price);
        }
      }
    }
  }

  const categoryCost = parseFloat(categoryPrice.toFixed(2));
  const tilesCost = parseFloat((tilesCount * tilesUnitPrice).toFixed(2));
  const unitPrice = parseFloat((categoryCost + tilesCost).toFixed(2));
  const totalPrice = parseFloat((unitPrice * (parseInt(quantity, 10) || 1)).toFixed(2));

  return {
    area_sqft: 0,
    price_per_sqft: 0,
    material_cost: 0,
    material_style_price_per_sqft: 0,
    material_style_cost: 0,
    frame_price_per_sqft: 0,
    frame_cost: 0,
    wallpaper_price_per_sqft: 0,
    wallpaper_cost: 0,
    base_price_per_sqft: 0,
    base_cost: 0,
    thickness_price_per_sqft: 0,
    thickness_cost: 0,
    element_cost: 0,
    add_border_base_price: 0,
    add_border_lit_extra: 0,
    add_border_cost: 0,
    lollipop_element_cost: 0,
    pylon_category_price: categoryPrice,
    pylon_tiles_price: tilesUnitPrice,
    pylon_category_cost: categoryCost,
    pylon_tiles_cost: tilesCost,
    color_extra: 0,
    font_extra: 0,
    illumination_cost: 0,
    illumination_rate_per_sqft: 0,
    unit_price: unitPrice,
    quantity: parseInt(quantity, 10) || 1,
    total_price: totalPrice,
  };
};

/**
 * Area in square feet from width × height in the customer's chosen unit.
 * dimension_units.conversion_to_sqft = area conversion factor to sq ft.
 * Example: foot² → 1, inch² → 0.006944, meter² → 10.7639
 */
const computeAreaSqft = async (height, width, dimensionUnitId) => {
  const h = parseFloat(height) || 0;
  const w = parseFloat(width) || 0;
  if (!dimensionUnitId) return h * w;
  const unit = await db.findOne('SELECT conversion_to_sqft FROM dimension_units WHERE id = ?', [dimensionUnitId]);
  const areaFactor = parseFloat(unit?.conversion_to_sqft || 1);
  return h * w * areaFactor;
};

/**
 * Calculate price for one item (cart or order)
 * @param {object} item        - cart/order item data
 * @param {number|null} vendorId - null = use admin prices
 */
const calculateItemPrice = async (item, vendorId = null) => {
  if (isListedItem(item)) {
    if (vendorId) {
      const err = new Error('Listed products are sold by admin only');
      err.statusCode = 400;
      throw err;
    }
    return calculateListedProductPrice(item);
  }
  if (isLollipopItem(item)) {
    return calculateLollipopSignPrice(item, vendorId);
  }
  if (isPylonItem(item)) {
    return calculatePylonSignPrice(item, vendorId);
  }

  const {
    material_id,
    material_style_id,
    frame_id,
    wallpaper_id,
    base_id,
    thickness_id,
    element_id,
    color_id,
    font_id,
    illumination_option_id,
    height = 0,
    width = 0,
    dimension_unit_id,
    quantity = 1,
  } = item;

  const baseAreaSqft = await computeAreaSqft(height, width, dimension_unit_id);

  // 3D Signage: total area = base dimension + sum(text entries) + sum(logo entries),
  // each entry converted by its own unit. Other products are unaffected.
  let textAreaSqft = 0;
  let logoAreaSqft = 0;
  if (is3DSignageItem(item)) {
    textAreaSqft = await sumDimensionAreaSqft(item.text_dimension);
    logoAreaSqft = await sumDimensionAreaSqft(item.logo_dimension);
  }
  const areaSqft = baseAreaSqft + textAreaSqft + logoAreaSqft;

  // Material cost (per sq ft)
  let pricePerSqft = 0;
  let materialCost = 0;
  if (material_id) {
    const material = await db.findOne('SELECT admin_price_per_sqft FROM materials WHERE id = ?', [material_id]);
    pricePerSqft = parseFloat(material?.admin_price_per_sqft || 0);
    if (vendorId) {
      const vp = await vendorPricingModel.getMaterialPrice(vendorId, material_id);
      if (vp) pricePerSqft = parseFloat(vp.price_per_sqft);
    }
    materialCost = areaSqft * pricePerSqft;
  }

  // Material style — per sq ft (no image master)
  let materialStylePricePerSqft = 0;
  let materialStyleCost = 0;
  if (material_style_id) {
    const ms = await db.findOne(
      'SELECT admin_price_per_sqft, product_type_id FROM material_styles WHERE id = ? AND is_active = 1',
      [material_style_id]
    );
    if (ms && String(ms.product_type_id) === String(item.product_type_id)) {
      materialStylePricePerSqft = parseFloat(ms.admin_price_per_sqft || 0);
      if (vendorId) {
        const vp = await vendorPricingModel.getMaterialStylePrice(vendorId, material_style_id);
        if (vp) materialStylePricePerSqft = parseFloat(vp.price_per_sqft);
      }
      materialStyleCost = areaSqft * materialStylePricePerSqft;
    }
  }

  // Frame — per sq ft (same pricing model as material)
  let framePricePerSqft = 0;
  let frameCost = 0;
  if (frame_id) {
    const fr = await db.findOne(
      'SELECT admin_price_per_sqft, product_type_id FROM frames WHERE id = ? AND is_active = 1',
      [frame_id]
    );
    if (fr && String(fr.product_type_id) === String(item.product_type_id)) {
      framePricePerSqft = parseFloat(fr.admin_price_per_sqft || 0);
      if (vendorId) {
        const vp = await vendorPricingModel.getFramePrice(vendorId, frame_id);
        if (vp) framePricePerSqft = parseFloat(vp.price_per_sqft);
      }
      frameCost = areaSqft * framePricePerSqft;
    }
  }

  // Wallpaper catalog — per sq ft (same model as frame)
  let wallpaperPricePerSqft = 0;
  let wallpaperCost = 0;
  if (wallpaper_id) {
    const wp = await db.findOne(
      'SELECT admin_price_per_sqft, product_type_id FROM wallpapers WHERE id = ? AND is_active = 1',
      [wallpaper_id]
    );
    if (wp && String(wp.product_type_id) === String(item.product_type_id)) {
      wallpaperPricePerSqft = parseFloat(wp.admin_price_per_sqft || 0);
      if (vendorId) {
        const vp = await vendorPricingModel.getWallpaperPrice(vendorId, wallpaper_id);
        if (vp) wallpaperPricePerSqft = parseFloat(vp.price_per_sqft);
      }
      wallpaperCost = areaSqft * wallpaperPricePerSqft;
    }
  }

  // Base (structure) cost — per sq ft, same area as material
  let basePricePerSqft = 0;
  let baseCost = 0;
  if (base_id) {
    const baseRow = await db.findOne('SELECT admin_price_per_sqft, product_type_id FROM bases WHERE id = ? AND is_active = 1', [base_id]);
    if (baseRow && String(baseRow.product_type_id) === String(item.product_type_id)) {
      basePricePerSqft = parseFloat(baseRow.admin_price_per_sqft || 0);
      if (vendorId) {
        const vp = await vendorPricingModel.getBasePrice(vendorId, base_id);
        if (vp) basePricePerSqft = parseFloat(vp.price_per_sqft);
      }
      baseCost = areaSqft * basePricePerSqft;
    }
  }

  // Thickness — per sq ft (same area model as base / material)
  let thicknessPricePerSqft = 0;
  let thicknessCost = 0;
  if (thickness_id) {
    const th = await db.findOne(
      'SELECT admin_price_per_sqft, product_type_id FROM thicknesses WHERE id = ? AND is_active = 1',
      [thickness_id]
    );
    if (th && String(th.product_type_id) === String(item.product_type_id)) {
      thicknessPricePerSqft = parseFloat(th.admin_price_per_sqft || 0);
      if (vendorId) {
        const vp = await vendorPricingModel.getThicknessPrice(vendorId, thickness_id);
        if (vp) thicknessPricePerSqft = parseFloat(vp.price_per_sqft);
      }
      thicknessCost = areaSqft * thicknessPricePerSqft;
    }
  }

  // Element extra (flat add-on, not multiplied by area in current model)
  let elementCost = 0;
  if (element_id) {
    const element = await db.findOne('SELECT admin_price_extra FROM elements WHERE id = ?', [element_id]);
    elementCost = parseFloat(element?.admin_price_extra || 0);
    if (vendorId) {
      const vp = await vendorPricingModel.getElementPrice(vendorId, element_id);
      if (vp) elementCost = parseFloat(vp.price_extra);
    }
  }

  // Color extra (flat)
  let colorExtra = 0;
  if (color_id) {
    const color = await db.findOne('SELECT admin_price_extra FROM colors WHERE id = ?', [color_id]);
    colorExtra = parseFloat(color?.admin_price_extra || 0);
    if (vendorId) {
      const vp = await vendorPricingModel.getColorPrice(vendorId, color_id);
      if (vp) colorExtra = parseFloat(vp.price_extra);
    }
  }

  // Font extra (per product-type row if present; flat add-on for cart line)
  let fontExtra = 0;
  if (font_id && item.product_type_id) {
    try {
      const row = await db.findOne(
        `SELECT ftp.admin_price_extra
         FROM font_product_type_pricing ftp
         WHERE ftp.font_id = ? AND ftp.product_type_id = ? AND ftp.is_active = 1`,
        [font_id, item.product_type_id]
      );
      fontExtra = parseFloat(row?.admin_price_extra || 0);
      if (vendorId) {
        const vp = await db.findOne(
          `SELECT price_extra FROM vendor_font_pricing
           WHERE vendor_id = ? AND font_id = ? AND product_type_id = ? AND is_active = 1`,
          [vendorId, font_id, item.product_type_id]
        );
        if (vp) fontExtra = parseFloat(vp.price_extra);
      }
    } catch (_) {
      fontExtra = 0;
    }
  }

  // Illumination (Lit / Non-Lit): price per sq ft — no letter-style multiplier here
  let illuminationCost = 0;
  let illuminationRatePerSqft = 0;
  const usesIllumination = Boolean(illumination_option_id);
  if (usesIllumination) {
    const io = await db.findOne(
      'SELECT admin_price_per_sqft FROM illumination_options WHERE id = ? AND is_active = 1',
      [illumination_option_id]
    );
    illuminationRatePerSqft = parseFloat(io?.admin_price_per_sqft || 0);
    if (vendorId) {
      const vp = await vendorPricingModel.getIlluminationPrice(vendorId, illumination_option_id);
      if (vp) illuminationRatePerSqft = parseFloat(vp.price_per_sqft);
    }
    illuminationCost = areaSqft * illuminationRatePerSqft;
  }

  const baseSum =
    materialCost +
    materialStyleCost +
    frameCost +
    wallpaperCost +
    baseCost +
    thicknessCost +
    elementCost +
    colorExtra +
    fontExtra +
    illuminationCost;
  const unitPrice = parseFloat(baseSum.toFixed(2));
  const totalPrice = parseFloat((unitPrice * quantity).toFixed(2));

  return {
    area_sqft: parseFloat(areaSqft.toFixed(4)),
    base_area_sqft: parseFloat(baseAreaSqft.toFixed(4)),
    text_area_sqft: parseFloat(textAreaSqft.toFixed(4)),
    logo_area_sqft: parseFloat(logoAreaSqft.toFixed(4)),
    price_per_sqft: pricePerSqft,
    material_cost: parseFloat(materialCost.toFixed(2)),
    material_style_price_per_sqft: parseFloat(materialStylePricePerSqft.toFixed(4)),
    material_style_cost: parseFloat(materialStyleCost.toFixed(2)),
    frame_price_per_sqft: parseFloat(framePricePerSqft.toFixed(4)),
    frame_cost: parseFloat(frameCost.toFixed(2)),
    wallpaper_price_per_sqft: parseFloat(wallpaperPricePerSqft.toFixed(4)),
    wallpaper_cost: parseFloat(wallpaperCost.toFixed(2)),
    base_price_per_sqft: parseFloat(basePricePerSqft.toFixed(4)),
    base_cost: parseFloat(baseCost.toFixed(2)),
    thickness_price_per_sqft: parseFloat(thicknessPricePerSqft.toFixed(4)),
    thickness_cost: parseFloat(thicknessCost.toFixed(2)),
    element_cost: parseFloat(elementCost.toFixed(2)),
    color_extra: parseFloat(colorExtra.toFixed(2)),
    font_extra: parseFloat(fontExtra.toFixed(2)),
    illumination_cost: parseFloat(illuminationCost.toFixed(2)),
    illumination_rate_per_sqft: parseFloat(illuminationRatePerSqft.toFixed(4)),
    add_border_base_price: 0,
    add_border_lit_extra: 0,
    add_border_cost: 0,
    lollipop_element_cost: 0,
    pylon_category_price: 0,
    pylon_tiles_price: 0,
    pylon_category_cost: 0,
    pylon_tiles_cost: 0,
    unit_price: unitPrice,
    quantity: parseInt(quantity, 10),
    total_price: totalPrice,
  };
};

/**
 * Vendor comparison for a cart item
 * Returns admin + all approved vendors with their prices
 */
const getVendorComparison = async (rawItem) => {
  // getItemById returns the row without a JOIN, so product_type_slug may be missing.
  // Resolve it so product-specific pricing (e.g. 3D Signage area sum) applies here too.
  let item = rawItem;
  if (!item.product_type_slug && item.product_type_id) {
    const pt = await db.findOne('SELECT slug FROM product_types WHERE id = ?', [item.product_type_id]);
    if (pt) item = { ...item, product_type_slug: pt.slug };
  }
  if (isListedItem(item)) {
    const adminPrice = await calculateListedProductPrice(item);
    return {
      admin: {
        seller: process.env.COMPANY_NAME || 'Company (Admin)',
        vendor_id: null,
        logo_url: process.env.COMPANY_LOGO_URL || null,
        ...adminPrice,
      },
      vendors: [],
      listed_product: true,
    };
  }
  const [adminPrice, vendors] = await Promise.all([
    calculateItemPrice(item, null),
    vendorModel.getAllApproved(),
  ]);

  const vendorPrices = await Promise.all(
    vendors.map(async (v) => {
      const price = await calculateItemPrice(item, v.id);
      return {
        vendor_id: v.id,
        business_name: v.business_name,
        logo_url: v.logo_url,
        ...price,
      };
    })
  );

  vendorPrices.sort((a, b) => a.total_price - b.total_price);

  return {
    admin: {
      seller: process.env.COMPANY_NAME || 'Company (Admin)',
      vendor_id: null,
      logo_url: process.env.COMPANY_LOGO_URL || null,
      ...adminPrice,
    },
    vendors: vendorPrices,
  };
};

module.exports = { calculateItemPrice, getVendorComparison, computeAreaSqft };
