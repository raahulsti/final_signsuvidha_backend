const cartModel    = require('../../models/cartModel');
const vendorModel  = require('../../models/vendorModel');
const { getVendorComparison } = require('../../services/pricingService');
const { success, created, notFound } = require('../../utils/response');

exports.getCart = async (req, res, next) => {
  try {
    const items = await cartModel.getCartByUser(req.user.id);
    return success(res, items);
  } catch (err) { next(err); }
};

exports.addItem = async (req, res, next) => {
  try {
    const result = await cartModel.addItem({ ...req.body, user_id: req.user.id });
    return created(res, { id: result.insertId }, 'Item added to cart');
  } catch (err) { next(err); }
};

exports.updateItem = async (req, res, next) => {
  try {
    const item = await cartModel.getItemById(req.params.id, req.user.id);
    if (!item) return notFound(res, 'Cart item not found');
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
