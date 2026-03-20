const vendorPricingModel = require('../../models/vendorPricingModel');
const vendorModel        = require('../../models/vendorModel');
const { success, notFound, error } = require('../../utils/response');

// ── Helper: get vendor ID for logged-in vendor user ───────────
const getVendorId = async (userId) => {
  const vendor = await vendorModel.getByUserId(userId);
  if (!vendor) throw Object.assign(new Error('Vendor profile not found'), { statusCode: 404 });
  if (!vendor.is_approved) throw Object.assign(new Error('Vendor not approved yet'), { statusCode: 403 });
  return vendor.id;
};

// ── Material Pricing ──────────────────────────────────────────
exports.getAllMaterialPrices = async (req, res, next) => {
  try {
    const vendorId = await getVendorId(req.user.id);
    return success(res, await vendorPricingModel.getAllMaterialPrices(vendorId));
  } catch (err) { next(err); }
};

exports.upsertMaterialPrice = async (req, res, next) => {
  try {
    const vendorId = await getVendorId(req.user.id);
    await vendorPricingModel.upsertMaterialPrice(vendorId, req.params.materialId, req.body.price_per_sqft);
    return success(res, {}, 'Material price updated');
  } catch (err) { next(err); }
};

// ── Element Pricing ───────────────────────────────────────────
exports.getAllElementPrices = async (req, res, next) => {
  try {
    const vendorId = await getVendorId(req.user.id);
    return success(res, await vendorPricingModel.getAllElementPrices(vendorId));
  } catch (err) { next(err); }
};

exports.upsertElementPrice = async (req, res, next) => {
  try {
    const vendorId = await getVendorId(req.user.id);
    await vendorPricingModel.upsertElementPrice(vendorId, req.params.elementId, req.body.price_extra);
    return success(res, {}, 'Element price updated');
  } catch (err) { next(err); }
};

// ── Color Pricing ─────────────────────────────────────────────
exports.upsertColorPrice = async (req, res, next) => {
  try {
    const vendorId = await getVendorId(req.user.id);
    await vendorPricingModel.upsertColorPrice(vendorId, req.params.colorId, req.body.price_extra);
    return success(res, {}, 'Color price updated');
  } catch (err) { next(err); }
};

// ── Letter Style Pricing ──────────────────────────────────────
exports.upsertLetterStylePrice = async (req, res, next) => {
  try {
    const vendorId = await getVendorId(req.user.id);
    const { price_multiplier, price_extra } = req.body;
    await vendorPricingModel.upsertLetterStylePrice(vendorId, req.params.letterStyleId, price_multiplier, price_extra);
    return success(res, {}, 'Letter style price updated');
  } catch (err) { next(err); }
};
