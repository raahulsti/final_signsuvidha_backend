const cartModel    = require('../../models/cartModel');
const vendorModel  = require('../../models/vendorModel');
const illuminationOptionModel = require('../../models/illuminationOptionModel');
const { getVendorComparison } = require('../../services/pricingService');
const { success, created, notFound, error } = require('../../utils/response');

const sanitizeOptionalImageFields = (body = {}) => {
  ['uploaded_image_url', 'preview_image_url'].forEach((key) => {
    if (body[key] === '') delete body[key];
  });
};

const validateIlluminationOptionForProductType = async (illuminationOptionId, productTypeId) => {
  if (!illuminationOptionId) return null;
  const option = await illuminationOptionModel.getById(illuminationOptionId);
  if (!option || !option.is_active) {
    const e = new Error('Selected lit/non-lit option not found');
    e.statusCode = 400;
    throw e;
  }
  if (String(option.product_type_id) !== String(productTypeId)) {
    const e = new Error('Selected lit/non-lit option does not belong to this product type');
    e.statusCode = 400;
    throw e;
  }
  return option;
};

exports.getCart = async (req, res, next) => {
  try {
    const items = await cartModel.getCartByUser(req.user.id);
    return success(res, items);
  } catch (err) { next(err); }
};

exports.addItem = async (req, res, next) => {
  try {
    sanitizeOptionalImageFields(req.body);
    if (req.file?.location) {
      req.body.uploaded_image_url = req.file.location;
    }
    await validateIlluminationOptionForProductType(
      req.body.illumination_option_id,
      req.body.product_type_id
    );
    const result = await cartModel.addItem({ ...req.body, user_id: req.user.id });
    return created(res, { id: result.insertId }, 'Item added to cart');
  } catch (err) { next(err); }
};

exports.updateItem = async (req, res, next) => {
  try {
    sanitizeOptionalImageFields(req.body);
    if (req.file?.location) {
      req.body.uploaded_image_url = req.file.location;
    }
    const item = await cartModel.getItemById(req.params.id, req.user.id);
    if (!item) return notFound(res, 'Cart item not found');
    if (!req.body.product_type_id) {
      return error(res, 'product_type_id is required while updating cart item', 400);
    }
    await validateIlluminationOptionForProductType(
      req.body.illumination_option_id,
      req.body.product_type_id
    );
    await cartModel.updateItem(req.params.id, req.body);
    return success(res, {}, 'Cart item updated');
  } catch (err) { next(err); }
};

exports.removeItem = async (req, res, next) => {
  try {
    const item = await cartModel.getItemById(req.params.id, req.user.id);
    if (!item) return notFound(res, 'Cart item not found');
    await cartModel.removeItem(req.params.id, req.user.id);
    return success(res, {}, 'Item removed from cart');
  } catch (err) { next(err); }
};

exports.vendorCompare = async (req, res, next) => {
  try {
    const item = await cartModel.getItemById(req.params.id, req.user.id);
    if (!item) return notFound(res, 'Cart item not found');
    const comparison = await getVendorComparison(item);
    return success(res, comparison, 'Vendor pricing comparison');
  } catch (err) { next(err); }
};

exports.selectVendor = async (req, res, next) => {
  try {
    const item = await cartModel.getItemById(req.params.id, req.user.id);
    if (!item) return notFound(res, 'Cart item not found');
    const { vendor_id } = req.body;
    // vendor_id = null means customer chose admin/company
    if (vendor_id) {
      const vendor = await vendorModel.getById(vendor_id);
      if (!vendor || !vendor.is_approved || !vendor.is_active)
        return notFound(res, 'Vendor not found or not active');
    }
    await cartModel.selectVendor(req.params.id, req.user.id, vendor_id);
    return success(res, {}, 'Vendor selected successfully');
  } catch (err) { next(err); }
};
