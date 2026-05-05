const cartModel    = require('../../models/cartModel');
const vendorModel  = require('../../models/vendorModel');
const illuminationOptionModel = require('../../models/illuminationOptionModel');
const { getVendorComparison, calculateItemPrice } = require('../../services/pricingService');
const { success, created, notFound, error } = require('../../utils/response');
const db = require('../../config/db');

const sanitizeOptionalImageFields = (body = {}) => {
  ['uploaded_image_url', 'preview_image_url'].forEach((key) => {
    if (body[key] === '') delete body[key];
  });
};

const ADMIN_SELLER_ID = process.env.ADMIN_SELLER_ID ? Number(process.env.ADMIN_SELLER_ID) : null;

const toNestedCartItem = (item, pricing = null, adminSellerId = null) => ({
  id: item.id,
  user_id: item.user_id,
  vendor_id: item.vendor_id,
  quantity: item.quantity,
  text_layers: item.text_layers || [],
  dimensions: {
    height: item.height,
    width: item.width,
    dimension_unit_id: item.dimension_unit_id,
    unit_name: item.unit_name,
    conversion_to_sqft: item.conversion_to_sqft,
  },
  images: {
    uploaded_image_url: item.uploaded_image_url,
    preview_image_url: item.preview_image_url,
  },
  product_type: {
    id: item.product_type_id,
    name: item.product_type_name,
    slug: item.product_type_slug,
  },
  material: item.material_id ? {
    id: item.material_id,
    name: item.material_name,
    admin_price_per_sqft: item.admin_price_per_sqft,
  } : null,
  element: item.element_id ? {
    id: item.element_id,
    name: item.element_name,
    admin_price_extra: item.admin_price_extra,
  } : null,
  color: item.color_id ? {
    id: item.color_id,
    name: item.color_name,
    hex_code: item.hex_code,
  } : null,
  font: item.font_id ? {
    id: item.font_id,
    name: item.font_name,
  } : null,
  illumination_option: item.illumination_option_id ? {
    id: item.illumination_option_id,
    name: item.illumination_option_name,
    category: item.illumination_category,
    admin_price_per_sqft: item.illumination_admin_price_per_sqft,
    unit: 'square feet',
  } : null,
  seller_type: item.vendor_id ? 'vendor' : 'admin',
  seller_id: item.vendor_id || adminSellerId,
  selected_vendor: item.vendor_id ? {
    id: item.vendor_id,
    business_name: item.vendor_name,
  } : null,
  pricing: pricing ? {
    area_sqft: pricing.area_sqft,
    unit_price: pricing.unit_price,
    total_price: pricing.total_price,
    breakdown: {
      material_price_per_sqft: pricing.price_per_sqft,
      material_cost: pricing.material_cost,
      element_cost: pricing.element_cost,
      color_extra: pricing.color_extra,
      font_extra: pricing.font_extra,
      illumination_cost: pricing.illumination_cost,
      illumination_rate_per_sqft: pricing.illumination_rate_per_sqft,
    },
  } : null,
  created_at: item.created_at,
  updated_at: item.updated_at,
});

const buildCartResponse = async (userId) => {
  const items = await cartModel.getCartByUser(userId);
  let adminSellerId = ADMIN_SELLER_ID;
  if (!adminSellerId) {
    const adminUser = await db.findOne(
      `SELECT u.id
       FROM users u
       INNER JOIN user_roles ur ON ur.user_id = u.id
       INNER JOIN roles r ON r.id = ur.role_id
       WHERE r.name = 'super_admin'
       ORDER BY u.id ASC
       LIMIT 1`
    );
    adminSellerId = adminUser?.id || null;
  }
  const enriched = await Promise.all(
    items.map(async (item) => {
      const pricing = await calculateItemPrice(item, item.vendor_id || null);
      return toNestedCartItem(item, pricing, adminSellerId);
    })
  );
  return enriched;
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
    return success(res, await buildCartResponse(req.user.id));
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

exports.increaseQuantity = async (req, res, next) => {
  try {
    const item = await cartModel.getItemById(req.params.id, req.user.id);
    if (!item) return notFound(res, 'Cart item not found');
    const nextQty = Number(item.quantity || 0) + 1;
    await cartModel.updateItem(req.params.id, { quantity: nextQty });
    return success(res, await buildCartResponse(req.user.id), 'Quantity increased');
  } catch (err) { next(err); }
};

exports.decreaseQuantity = async (req, res, next) => {
  try {
    const item = await cartModel.getItemById(req.params.id, req.user.id);
    if (!item) return notFound(res, 'Cart item not found');
    const nextQty = Math.max(1, Number(item.quantity || 1) - 1);
    await cartModel.updateItem(req.params.id, { quantity: nextQty });
    return success(res, await buildCartResponse(req.user.id), 'Quantity decreased');
  } catch (err) { next(err); }
};

exports.setQuantity = async (req, res, next) => {
  try {
    const item = await cartModel.getItemById(req.params.id, req.user.id);
    if (!item) return notFound(res, 'Cart item not found');
    const qty = Number(req.body?.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
      return error(res, 'quantity must be an integer between 1 and 100', 400);
    }
    await cartModel.updateItem(req.params.id, { quantity: qty });
    return success(res, await buildCartResponse(req.user.id), 'Quantity updated');
  } catch (err) { next(err); }
};
