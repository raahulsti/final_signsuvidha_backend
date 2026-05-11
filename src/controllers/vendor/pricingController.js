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

exports.getAllBasePrices = async (req, res, next) => {
  try {
    const vendorId = await getVendorId(req.user.id);
    return success(res, await vendorPricingModel.getAllBasePrices(vendorId));
  } catch (err) { next(err); }
};

exports.upsertBasePrice = async (req, res, next) => {
  try {
    const vendorId = await getVendorId(req.user.id);
    await vendorPricingModel.upsertBasePrice(vendorId, req.params.baseId, req.body.price_per_sqft);
    return success(res, {}, 'Base price updated');
  } catch (err) { next(err); }
};

exports.getAllThicknessPrices = async (req, res, next) => {
  try {
    const vendorId = await getVendorId(req.user.id);
    return success(res, await vendorPricingModel.getAllThicknessPrices(vendorId));
  } catch (err) { next(err); }
};

exports.upsertThicknessPrice = async (req, res, next) => {
  try {
    const vendorId = await getVendorId(req.user.id);
    await vendorPricingModel.upsertThicknessPrice(
      vendorId,
      req.params.thicknessId,
      req.body.price_per_sqft
    );
    return success(res, {}, 'Thickness price updated');
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

// ── Font Pricing (Product Type based) ─────────────────────────
exports.getAllFontPrices = async (req, res, next) => {
  try {
    const vendorId = await getVendorId(req.user.id);
    const productTypeId = req.query.product_type_id ? Number(req.query.product_type_id) : undefined;
    return success(res, await vendorPricingModel.getAllFontPrices(vendorId, productTypeId));
  } catch (err) { next(err); }
};

exports.upsertFontPrice = async (req, res, next) => {
  try {
    const vendorId = await getVendorId(req.user.id);
    const { product_type_id, price_extra } = req.body;
    await vendorPricingModel.upsertFontPrice(vendorId, req.params.fontId, product_type_id, price_extra);
    return success(res, {}, 'Font price updated');
  } catch (err) { next(err); }
};

// ── Illumination (Lit / Non-Lit) ──────────────────────────────
exports.getAllIlluminationPrices = async (req, res, next) => {
  try {
    const vendorId = await getVendorId(req.user.id);
    const productTypeId = req.query.product_type_id ? Number(req.query.product_type_id) : undefined;
    return success(res, await vendorPricingModel.getAllIlluminationPrices(vendorId, productTypeId));
  } catch (err) { next(err); }
};

exports.upsertIlluminationPrice = async (req, res, next) => {
  try {
    const vendorId = await getVendorId(req.user.id);
    await vendorPricingModel.upsertIlluminationPrice(
      vendorId,
      req.params.illuminationOptionId,
      req.body.price_per_sqft
    );
    return success(res, {}, 'Illumination price updated');
  } catch (err) { next(err); }
};
