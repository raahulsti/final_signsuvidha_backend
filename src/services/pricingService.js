const db               = require('../config/db');
const vendorPricingModel = require('../models/vendorPricingModel');
const vendorModel      = require('../models/vendorModel');

/**
 * Calculate price for one item (cart or order)
 * @param {object} item        - cart/order item data
 * @param {number|null} vendorId - null = use admin prices
 */
const calculateItemPrice = async (item, vendorId = null) => {
  const { material_id, element_id, color_id, letter_style_id,
          height = 0, width = 0, dimension_unit_id, quantity = 1 } = item;

  // 1. Dimension → sqft
  let conversionFactor = 1;
  if (dimension_unit_id) {
    const unit = await db.findOne('SELECT conversion_to_sqft FROM dimension_units WHERE id = ?', [dimension_unit_id]);
    conversionFactor = parseFloat(unit?.conversion_to_sqft || 1);
  }
  const areaSqft = parseFloat(height) * parseFloat(width) * conversionFactor;

  // 2. Material cost
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

  // 3. Element extra
  let elementCost = 0;
  if (element_id) {
    const element = await db.findOne('SELECT admin_price_extra FROM elements WHERE id = ?', [element_id]);
    elementCost = parseFloat(element?.admin_price_extra || 0);
    if (vendorId) {
      const vp = await vendorPricingModel.getElementPrice(vendorId, element_id);
      if (vp) elementCost = parseFloat(vp.price_extra);
    }
  }

  // 4. Color extra
  let colorExtra = 0;
  if (color_id) {
    const color = await db.findOne('SELECT admin_price_extra FROM colors WHERE id = ?', [color_id]);
    colorExtra = parseFloat(color?.admin_price_extra || 0);
    if (vendorId) {
      const vp = await vendorPricingModel.getColorPrice(vendorId, color_id);
      if (vp) colorExtra = parseFloat(vp.price_extra);
    }
  }

  // 5. Letter style
  let multiplier       = 1;
  let letterStyleExtra = 0;
  if (letter_style_id) {
    const ls = await db.findOne('SELECT price_multiplier, admin_price_extra FROM letter_styles WHERE id = ?', [letter_style_id]);
    multiplier       = parseFloat(ls?.price_multiplier || 1);
    letterStyleExtra = parseFloat(ls?.admin_price_extra || 0);
    if (vendorId) {
      const vp = await vendorPricingModel.getLetterStylePrice(vendorId, letter_style_id);
      if (vp) {
        if (vp.price_multiplier) multiplier       = parseFloat(vp.price_multiplier);
        if (vp.price_extra)      letterStyleExtra  = parseFloat(vp.price_extra);
      }
    }
  }

  const baseSum  = materialCost + elementCost + colorExtra + letterStyleExtra;
  const unitPrice  = parseFloat((baseSum * multiplier).toFixed(2));
  const totalPrice = parseFloat((unitPrice * quantity).toFixed(2));

  return {
    area_sqft:          parseFloat(areaSqft.toFixed(4)),
    price_per_sqft:     pricePerSqft,
    material_cost:      parseFloat(materialCost.toFixed(2)),
    element_cost:       parseFloat(elementCost.toFixed(2)),
    color_extra:        parseFloat(colorExtra.toFixed(2)),
    letter_style_extra: parseFloat(letterStyleExtra.toFixed(2)),
    unit_price:         unitPrice,
    quantity:           parseInt(quantity),
    total_price:        totalPrice,
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
        vendor_id:     v.id,
        business_name: v.business_name,
        logo_url:      v.logo_url,
        ...price,
      };
    })
  );

  // Sort vendors by total_price ascending
  vendorPrices.sort((a, b) => a.total_price - b.total_price);

  return {
    admin:   { seller: 'Company (Admin)', vendor_id: null, ...adminPrice },
    vendors: vendorPrices,
  };
};

module.exports = { calculateItemPrice, getVendorComparison };
