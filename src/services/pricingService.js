const db = require('../config/db');
const vendorPricingModel = require('../models/vendorPricingModel');
const vendorModel = require('../models/vendorModel');

/**
 * Area in square feet from width × height in the customer's chosen unit.
 * dimension_units.conversion_to_sqft = feet per 1 unit of width/height (linear).
 * Example: foot → 1, inch → 1/12, cm → 0.0328084
 */
const computeAreaSqft = async (height, width, dimensionUnitId) => {
  const h = parseFloat(height) || 0;
  const w = parseFloat(width) || 0;
  if (!dimensionUnitId) return h * w;
  const unit = await db.findOne('SELECT conversion_to_sqft FROM dimension_units WHERE id = ?', [dimensionUnitId]);
  const linearFt = parseFloat(unit?.conversion_to_sqft || 1);
  return h * w * linearFt * linearFt;
};

/**
 * Calculate price for one item (cart or order)
 * @param {object} item        - cart/order item data
 * @param {number|null} vendorId - null = use admin prices
 */
const calculateItemPrice = async (item, vendorId = null) => {
  const {
    material_id,
    element_id,
    color_id,
    font_id,
    illumination_option_id,
    height = 0,
    width = 0,
    dimension_unit_id,
    quantity = 1,
  } = item;

  const areaSqft = await computeAreaSqft(height, width, dimension_unit_id);

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
    materialCost + elementCost + colorExtra + fontExtra + illuminationCost;
  const unitPrice = parseFloat(baseSum.toFixed(2));
  const totalPrice = parseFloat((unitPrice * quantity).toFixed(2));

  return {
    area_sqft: parseFloat(areaSqft.toFixed(4)),
    price_per_sqft: pricePerSqft,
    material_cost: parseFloat(materialCost.toFixed(2)),
    element_cost: parseFloat(elementCost.toFixed(2)),
    color_extra: parseFloat(colorExtra.toFixed(2)),
    font_extra: parseFloat(fontExtra.toFixed(2)),
    illumination_cost: parseFloat(illuminationCost.toFixed(2)),
    illumination_rate_per_sqft: parseFloat(illuminationRatePerSqft.toFixed(4)),
    unit_price: unitPrice,
    quantity: parseInt(quantity, 10),
    total_price: totalPrice,
  };
};

/**
 * Vendor comparison for a cart item
 * Returns admin + all approved vendors with their prices
 */
const getVendorComparison = async (item) => {
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
