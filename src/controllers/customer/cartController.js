const cartModel    = require('../../models/cartModel');
const vendorModel  = require('../../models/vendorModel');
const illuminationOptionModel = require('../../models/illuminationOptionModel');
const baseModel    = require('../../models/baseModel');
const thicknessModel = require('../../models/thicknessModel');
const materialStyleModel = require('../../models/materialStyleModel');
const frameModel   = require('../../models/frameModel');
const wallpaperModel = require('../../models/wallpaperModel');
const { PRODUCT_SLUGS, LOLLIPOP_PRODUCT_TYPE_ID } = require('../../utils/constants');
const addBorderModel = require('../../models/addBorderModel');
const lollipopElementModel = require('../../models/lollipopElementModel');
const pylonModel = require('../../models/pylonModel');
const listedProductModel = require('../../models/listedProductModel');
const { LISTED_PRODUCT_SIZES } = require('../../utils/constants');
const { getVendorComparison, calculateItemPrice } = require('../../services/pricingService');
const { success, created, notFound, error } = require('../../utils/response');
const db = require('../../config/db');
const { isPylonTilesImageField } = require('../../middleware/uploadS3');

const sanitizeOptionalImageFields = (body = {}) => {
  ['uploaded_image_url', 'preview_image_url'].forEach((key) => {
    if (body[key] === '') delete body[key];
  });
};

const ADMIN_SELLER_ID = process.env.ADMIN_SELLER_ID ? Number(process.env.ADMIN_SELLER_ID) : null;

/** DB description only; empty string → null (no name fallback). */
const nullableDescription = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

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
    preview_image_url: item.preview_image_url
      || (item.pylon_id ? (item.pylon_file_url || item.pylon_thumbnail_url) : null),
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
    description: nullableDescription(item.material_description),
    file_url: nullableDescription(item.material_file_url),
  } : null,
  material_style: item.material_style_id ? {
    id: item.material_style_id,
    name: item.material_style_name,
    admin_price_per_sqft: item.material_style_admin_price_per_sqft,
    description: nullableDescription(item.material_style_description),
  } : null,
  frame: item.frame_id ? {
    id: item.frame_id,
    name: item.frame_name,
    admin_price_per_sqft: item.frame_admin_price_per_sqft,
    description: nullableDescription(item.frame_description),
    file_url: nullableDescription(item.frame_file_url),
  } : null,
  wallpaper: item.wallpaper_id ? {
    id: item.wallpaper_id,
    name: item.wallpaper_name,
    wallpaper_type: item.wallpaper_type,
    admin_price_per_sqft: item.wallpaper_admin_price_per_sqft,
    description: nullableDescription(item.wallpaper_description),
    file_url: nullableDescription(item.wallpaper_file_url),
  } : null,
  add_border: item.add_border_id ? {
    id: item.add_border_id,
    shape: item.add_border_shape,
    size: item.add_border_size,
    height: nullableDescription(item.add_border_height),
    width: nullableDescription(item.add_border_width),
    border_is_lit: Boolean(item.border_is_lit),
    admin_price: item.add_border_admin_price,
    lit_price: item.add_border_lit_price,
    file_url: nullableDescription(item.add_border_file_url),
  } : null,
  lollipop_element: item.lollipop_element_id ? {
    id: item.lollipop_element_id,
    name: item.lollipop_element_name,
    description: nullableDescription(item.lollipop_element_description),
    price: parseFloat(item.lollipop_element_admin_price || 0),
    admin_price: parseFloat(item.lollipop_element_admin_price || 0),
    image: nullableDescription(item.lollipop_element_file_url || item.lollipop_element_thumbnail_url),
    file_url: nullableDescription(item.lollipop_element_file_url),
    thumbnail_url: nullableDescription(item.lollipop_element_thumbnail_url),
  } : null,
  pylon: item.pylon_id ? {
    id: item.pylon_id,
    name: item.pylon_name,
    description: nullableDescription(item.pylon_description),
    thumbnail_url: nullableDescription(item.pylon_thumbnail_url),
    file_url: nullableDescription(item.pylon_file_url),
  } : null,
  pylon_category: item.pylon_category_id ? {
    id: item.pylon_category_id,
    name: item.pylon_category_name,
    category_price: parseFloat(item.pylon_category_admin_price || 0),
    tiles_name: item.pylon_tiles_name,
    tiles_price: parseFloat(item.pylon_tiles_admin_price || 0),
  } : null,
  tiles: item.pylon_id ? (parseInt(item.pylon_tiles_count, 10) || 0) : null,
  pylon_tiles_images: item.pylon_id ? (item.pylon_tiles_images || []) : [],
  base: item.base_id ? {
    id: item.base_id,
    name: item.base_name,
    admin_price_per_sqft: item.base_admin_price_per_sqft,
    description: nullableDescription(item.base_description),
    file_url: nullableDescription(item.base_file_url),
  } : null,
  thickness: item.thickness_id ? {
    id: item.thickness_id,
    name: item.thickness_name,
    admin_price_per_sqft: item.thickness_admin_price_per_sqft,
    description: nullableDescription(item.thickness_description),
    file_url: nullableDescription(item.thickness_file_url),
  } : null,
  element: item.element_id ? {
    id: item.element_id,
    name: item.element_name,
    admin_price_extra: item.admin_price_extra,
    description: nullableDescription(item.element_description),
    file_url: nullableDescription(item.element_file_url),
  } : null,
  color: item.color_id ? {
    id: item.color_id,
    name: item.color_name,
    hex_code: item.hex_code,
  } : null,
  font: item.font_id ? {
    id: item.font_id,
    name: item.font_name,
    file_url: nullableDescription(item.font_file_url),
  } : null,
  illumination_option: item.illumination_option_id ? {
    id: item.illumination_option_id,
    name: item.illumination_option_name,
    category: item.illumination_category,
    admin_price_per_sqft: item.illumination_admin_price_per_sqft,
    unit: 'square feet',
    description: nullableDescription(item.illumination_description),
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
      material_style_price_per_sqft: pricing.material_style_price_per_sqft,
      material_style_cost: pricing.material_style_cost,
      frame_price_per_sqft: pricing.frame_price_per_sqft,
      frame_cost: pricing.frame_cost,
      wallpaper_price_per_sqft: pricing.wallpaper_price_per_sqft,
      wallpaper_cost: pricing.wallpaper_cost,
      add_border_base_price: pricing.add_border_base_price,
      add_border_lit_extra: pricing.add_border_lit_extra,
      add_border_cost: pricing.add_border_cost,
      lollipop_element_cost: pricing.lollipop_element_cost,
      pylon_category_price: pricing.pylon_category_price,
      pylon_tiles_price: pricing.pylon_tiles_price,
      pylon_category_cost: pricing.pylon_category_cost,
      pylon_tiles_cost: pricing.pylon_tiles_cost,
      base_price_per_sqft: pricing.base_price_per_sqft,
      base_cost: pricing.base_cost,
      thickness_price_per_sqft: pricing.thickness_price_per_sqft,
      thickness_cost: pricing.thickness_cost,
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

const toNestedListedCartItem = async (item, pricing, adminSellerId) => {
  const images = await listedProductModel.getImages(item.listed_product_id);
  return {
    item_type: 'listed',
    id: item.id,
    user_id: item.user_id,
    quantity: item.quantity,
    listed_product: {
      id: item.listed_product_id,
      name: item.listed_product_name,
      description: item.listed_product_description,
      size: item.listed_product_size,
      height: item.listed_variant_height || null,
      width: item.listed_variant_width || null,
      images: images.map((i) => i.file_url),
      thumbnail_url: images[0]?.file_url || item.listed_product_thumbnail || null,
    },
    color: item.color_id ? {
      id: item.color_id,
      name: item.color_name,
      hex_code: item.hex_code,
    } : null,
    product_type: item.product_type_id ? {
      id: item.product_type_id,
      name: item.product_type_name,
      slug: item.product_type_slug,
    } : null,
    seller_type: 'admin',
    seller_id: adminSellerId,
    selected_vendor: null,
    pricing: {
      unit_price: pricing.unit_price,
      total_price: pricing.total_price,
      breakdown: {},
    },
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
};

const resolveAdminSellerId = async () => {
  if (ADMIN_SELLER_ID) return ADMIN_SELLER_ID;
  const adminUser = await db.findOne(
    `SELECT u.id
     FROM users u
     INNER JOIN user_roles ur ON ur.user_id = u.id
     INNER JOIN roles r ON r.id = ur.role_id
     WHERE r.name = 'super_admin'
     ORDER BY u.id ASC
     LIMIT 1`
  );
  return adminUser?.id || null;
};

const buildCartResponse = async (userId, { customOnly = false, listedOnly = false } = {}) => {
  const items = await cartModel.getCartByUser(userId, { customOnly, listedOnly });
  const adminSellerId = await resolveAdminSellerId();
  const enriched = await Promise.all(
    items.map(async (item) => {
      if (item.listed_product_id) {
        const pricing = await calculateItemPrice(item, null);
        return toNestedListedCartItem(item, pricing, adminSellerId);
      }
      const pricing = await calculateItemPrice(item, item.vendor_id || null);
      return { ...toNestedCartItem(item, pricing, adminSellerId), item_type: 'custom' };
    })
  );
  return enriched;
};

const validateBaseForProductType = async (baseId, productTypeId) => {
  if (!baseId) return null;
  const row = await baseModel.getById(baseId);
  if (!row || !row.is_active) {
    const e = new Error('Selected base not found or inactive');
    e.statusCode = 400;
    throw e;
  }
  if (String(row.product_type_id) !== String(productTypeId)) {
    const e = new Error('Selected base does not belong to this product type');
    e.statusCode = 400;
    throw e;
  }
  return row;
};

const validateThicknessForProductType = async (thicknessId, productTypeId) => {
  if (!thicknessId) return null;
  const row = await thicknessModel.getById(thicknessId);
  if (!row || !row.is_active) {
    const e = new Error('Selected thickness not found or inactive');
    e.statusCode = 400;
    throw e;
  }
  if (String(row.product_type_id) !== String(productTypeId)) {
    const e = new Error('Selected thickness does not belong to this product type');
    e.statusCode = 400;
    throw e;
  }
  return row;
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

const validateFrameForProductType = async (frameId, productTypeId) => {
  if (!frameId) return null;
  const row = await frameModel.getById(frameId);
  if (!row || !row.is_active) {
    const e = new Error('Selected frame not found or inactive');
    e.statusCode = 400;
    throw e;
  }
  if (String(row.product_type_id) !== String(productTypeId)) {
    const e = new Error('Selected frame does not belong to this product type');
    e.statusCode = 400;
    throw e;
  }
  return row;
};

const validateMaterialStyleForProductType = async (materialStyleId, productTypeId) => {
  if (!materialStyleId) return null;
  const row = await materialStyleModel.getById(materialStyleId);
  if (!row || !row.is_active) {
    const e = new Error('Selected material style not found or inactive');
    e.statusCode = 400;
    throw e;
  }
  if (String(row.product_type_id) !== String(productTypeId)) {
    const e = new Error('Selected material style does not belong to this product type');
    e.statusCode = 400;
    throw e;
  }
  return row;
};

const isLollipopProductType = (productTypeId, slug) =>
  String(productTypeId) === String(LOLLIPOP_PRODUCT_TYPE_ID) || slug === PRODUCT_SLUGS.LOLLIPOP_SIGN;

const isPylonProductType = (productTypeId, slug) =>
  slug === PRODUCT_SLUGS.PYLON_SIGN;

const normalizePylonCartFields = (body) => {
  if (body.tiles !== undefined && body.pylon_tiles_count === undefined) {
    body.pylon_tiles_count = body.tiles;
  }
};

/** Pylon: pylon + category + tiles count required. */
const validatePylonCart = async ({ product_type_id, pylon_id, pylon_category_id, pylon_tiles_count }) => {
  const pt = await db.findOne('SELECT slug FROM product_types WHERE id = ?', [product_type_id]);
  if (!pt || !isPylonProductType(product_type_id, pt.slug)) return;

  if (!pylon_id) {
    const e = new Error('Select a pylon product');
    e.statusCode = 400;
    throw e;
  }
  if (!pylon_category_id) {
    const e = new Error('Select a pylon category');
    e.statusCode = 400;
    throw e;
  }
  const tilesCount = parseInt(pylon_tiles_count, 10);
  if (!Number.isInteger(tilesCount) || tilesCount < 0) {
    const e = new Error('tiles count must be a non-negative integer');
    e.statusCode = 400;
    throw e;
  }

  const pylon = await pylonModel.getById(pylon_id);
  if (!pylon || !pylon.is_active) {
    const e = new Error('Selected pylon not found or inactive');
    e.statusCode = 400;
    throw e;
  }
  if (String(pylon.product_type_id) !== String(product_type_id)) {
    const e = new Error('Selected pylon does not belong to this product type');
    e.statusCode = 400;
    throw e;
  }

  const category = await pylonModel.getCategoryById(pylon_category_id);
  if (!category || !category.is_active || String(category.pylon_id) !== String(pylon_id)) {
    const e = new Error('Selected pylon category not found or inactive');
    e.statusCode = 400;
    throw e;
  }
};

/** Lollipop: border required; element only after border; no dimension unit required. */
const validateLollipopCart = async ({ product_type_id, add_border_id, border_is_lit, lollipop_element_id }) => {
  const pt = await db.findOne('SELECT slug FROM product_types WHERE id = ?', [product_type_id]);
  if (!pt || !isLollipopProductType(product_type_id, pt.slug)) return;

  if (!add_border_id) {
    const e = new Error('Select add border (shape and size) for lollipop sign');
    e.statusCode = 400;
    throw e;
  }
  const border = await addBorderModel.getById(add_border_id);
  if (!border || !border.is_active) {
    const e = new Error('Selected add border not found or inactive');
    e.statusCode = 400;
    throw e;
  }
  if (String(border.product_type_id) !== String(product_type_id)) {
    const e = new Error('Selected add border does not belong to this product type');
    e.statusCode = 400;
    throw e;
  }

  if (lollipop_element_id) {
    const el = await lollipopElementModel.getByIdRaw(lollipop_element_id);
    if (!el || !el.is_active) {
      const e = new Error('Selected lollipop element not found or inactive');
      e.statusCode = 400;
      throw e;
    }
    if (String(el.product_type_id) !== String(product_type_id)) {
      const e = new Error('Selected lollipop element does not belong to this product type');
      e.statusCode = 400;
      throw e;
    }
  }
};

/** Wallpaper product: require material style (Plain / Woven / Textured), not materials table. */
const validateWallpaperMaterialStyle = async ({ product_type_id, material_style_id }) => {
  const pt = await db.findOne('SELECT slug FROM product_types WHERE id = ?', [product_type_id]);
  if (!pt) {
    const e = new Error('Invalid product type');
    e.statusCode = 400;
    throw e;
  }
  if (pt.slug !== PRODUCT_SLUGS.WALLPAPER) return;
  if (!material_style_id) {
    const e = new Error('Select a material style for wallpaper products');
    e.statusCode = 400;
    throw e;
  }
  await validateMaterialStyleForProductType(material_style_id, product_type_id);
};

/** Wallpaper product: require a catalog wallpaper row (design) for this product type. */
const validateWallpaperCatalogRow = async ({ product_type_id, wallpaper_id }) => {
  const pt = await db.findOne('SELECT slug FROM product_types WHERE id = ?', [product_type_id]);
  if (!pt) {
    const e = new Error('Invalid product type');
    e.statusCode = 400;
    throw e;
  }
  if (pt.slug !== PRODUCT_SLUGS.WALLPAPER) return;
  if (!wallpaper_id) {
    const e = new Error('Select a wallpaper design for wallpaper products');
    e.statusCode = 400;
    throw e;
  }
  const row = await wallpaperModel.getById(wallpaper_id);
  if (!row || !row.is_active) {
    const e = new Error('Selected wallpaper design not found or inactive');
    e.statusCode = 400;
    throw e;
  }
  if (String(row.product_type_id) !== String(product_type_id)) {
    const e = new Error('Selected wallpaper design does not belong to this product type');
    e.statusCode = 400;
    throw e;
  }
};

exports.getCart = async (req, res, next) => {
  try {
    return success(res, await buildCartResponse(req.user.id, { customOnly: true }));
  } catch (err) { next(err); }
};

exports.getListedCart = async (req, res, next) => {
  try {
    return success(res, await buildCartResponse(req.user.id, { listedOnly: true }));
  } catch (err) { next(err); }
};

exports.addListedItem = async (req, res, next) => {
  try {
    const { listed_product_id, size, quantity, color_id } = req.body;
    if (!LISTED_PRODUCT_SIZES.includes(size)) {
      return error(res, 'Invalid size. Use regular, medium, or large', 400);
    }
    const variant = await listedProductModel.getVariantPrice(listed_product_id, size);
    if (!variant) {
      return error(res, 'This size is not available for this product. Choose from the sizes shown on the product.', 400);
    }
    const product = await listedProductModel.getById(listed_product_id);
    if (!product || !product.is_active) return notFound(res, 'Listed product not found');

    if (color_id) {
      const color = await db.findOne(
        `SELECT c.id FROM colors c
         INNER JOIN product_type_colors ptc ON ptc.color_id = c.id
         WHERE c.id = ? AND c.is_active = 1 AND ptc.product_type_id = ?`,
        [color_id, product.product_type_id]
      );
      if (!color) return error(res, 'Selected color not found or not available for this product', 400);
    }

    const result = await cartModel.addListedItem({
      user_id: req.user.id,
      listed_product_id,
      listed_product_size: size,
      product_type_id: product.product_type_id,
      quantity,
      color_id: color_id || null,
    });
    return created(res, {
      id: result.insertId,
      merged: result.merged,
      cart: await buildCartResponse(req.user.id, { listedOnly: true }),
    }, result.merged ? 'Quantity updated in cart' : 'Listed product added to cart');
  } catch (err) { next(err); }
};

exports.addItem = async (req, res, next) => {
  try {
    sanitizeOptionalImageFields(req.body);
    normalizePylonCartFields(req.body);
    const ptRow = await db.findOne('SELECT slug FROM product_types WHERE id = ?', [req.body.product_type_id]);
    const isLollipop = isLollipopProductType(req.body.product_type_id, ptRow?.slug);
    const isPylon = isPylonProductType(req.body.product_type_id, ptRow?.slug);

    if (isPylon) {
      await validatePylonCart({
        product_type_id: req.body.product_type_id,
        pylon_id: req.body.pylon_id,
        pylon_category_id: req.body.pylon_category_id,
        pylon_tiles_count: req.body.pylon_tiles_count,
      });
    } else if (isLollipop) {
      await validateLollipopCart({
        product_type_id: req.body.product_type_id,
        add_border_id: req.body.add_border_id,
        border_is_lit: req.body.border_is_lit,
        lollipop_element_id: req.body.lollipop_element_id,
      });
    } else {
      await validateIlluminationOptionForProductType(
        req.body.illumination_option_id,
        req.body.product_type_id
      );
      await validateFrameForProductType(req.body.frame_id, req.body.product_type_id);
      await validateWallpaperMaterialStyle({
        product_type_id: req.body.product_type_id,
        material_style_id: req.body.material_style_id,
      });
      await validateMaterialStyleForProductType(req.body.material_style_id, req.body.product_type_id);
      await validateWallpaperCatalogRow({
        product_type_id: req.body.product_type_id,
        wallpaper_id: req.body.wallpaper_id,
      });
      await validateBaseForProductType(req.body.base_id, req.body.product_type_id);
      await validateThicknessForProductType(req.body.thickness_id, req.body.product_type_id);
    }
    const result = await cartModel.addItem({ ...req.body, user_id: req.user.id });
    return created(res, { id: result.insertId }, 'Item added to cart');
  } catch (err) { next(err); }
};

exports.updateItem = async (req, res, next) => {
  try {
    sanitizeOptionalImageFields(req.body);
    normalizePylonCartFields(req.body);
    const item = await cartModel.getItemById(req.params.id, req.user.id);
    if (!item) return notFound(res, 'Cart item not found');
    if (item.listed_product_id) {
      return error(res, 'Use quantity endpoints to update listed product cart lines', 400);
    }
    if (!req.body.product_type_id) {
      return error(res, 'product_type_id is required while updating cart item', 400);
    }
    const ptRow = await db.findOne('SELECT slug FROM product_types WHERE id = ?', [req.body.product_type_id]);
    const isLollipop = isLollipopProductType(req.body.product_type_id, ptRow?.slug);
    const isPylon = isPylonProductType(req.body.product_type_id, ptRow?.slug);

    if (isPylon) {
      const pylonId = req.body.pylon_id !== undefined ? req.body.pylon_id : item.pylon_id;
      const categoryId = req.body.pylon_category_id !== undefined ? req.body.pylon_category_id : item.pylon_category_id;
      const tilesCount = req.body.pylon_tiles_count !== undefined ? req.body.pylon_tiles_count : item.pylon_tiles_count;
      await validatePylonCart({
        product_type_id: req.body.product_type_id,
        pylon_id: pylonId,
        pylon_category_id: categoryId,
        pylon_tiles_count: tilesCount,
      });
    } else if (isLollipop) {
      const addBorderId = req.body.add_border_id !== undefined ? req.body.add_border_id : item.add_border_id;
      const lollipopElementId = req.body.lollipop_element_id !== undefined
        ? req.body.lollipop_element_id
        : item.lollipop_element_id;
      const borderIsLit = req.body.border_is_lit !== undefined ? req.body.border_is_lit : item.border_is_lit;
      await validateLollipopCart({
        product_type_id: req.body.product_type_id,
        add_border_id: addBorderId,
        border_is_lit: borderIsLit,
        lollipop_element_id: lollipopElementId,
      });
    } else {
      await validateIlluminationOptionForProductType(
        req.body.illumination_option_id,
        req.body.product_type_id
      );
      await validateFrameForProductType(req.body.frame_id, req.body.product_type_id);
      const materialStyleId = req.body.material_style_id !== undefined ? req.body.material_style_id : item.material_style_id;
      const wallpaperId = req.body.wallpaper_id !== undefined ? req.body.wallpaper_id : item.wallpaper_id;
      await validateWallpaperMaterialStyle({
        product_type_id: req.body.product_type_id,
        material_style_id: materialStyleId,
      });
      await validateMaterialStyleForProductType(req.body.material_style_id, req.body.product_type_id);
      await validateWallpaperCatalogRow({
        product_type_id: req.body.product_type_id,
        wallpaper_id: wallpaperId,
      });
      await validateBaseForProductType(req.body.base_id, req.body.product_type_id);
      await validateThicknessForProductType(req.body.thickness_id, req.body.product_type_id);
    }
    if (isPylon && req.body.pylon_tiles_images !== undefined) {
      const hadNewUploads = (req.files || []).some((f) => isPylonTilesImageField(f.fieldname));
      if (hadNewUploads) {
        const prev = item.pylon_tiles_images || [];
        req.body.pylon_tiles_images = [...new Set([...prev, ...req.body.pylon_tiles_images])];
      }
    }
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
    if (item.listed_product_id) {
      return success(res, await getVendorComparison(item), 'Listed product — admin price only');
    }
    const comparison = await getVendorComparison(item);
    return success(res, comparison, 'Vendor pricing comparison');
  } catch (err) { next(err); }
};

exports.selectVendor = async (req, res, next) => {
  try {
    const item = await cartModel.getItemById(req.params.id, req.user.id);
    if (!item) return notFound(res, 'Cart item not found');
    if (item.listed_product_id) {
      return error(res, 'Listed products are fulfilled by admin only', 400);
    }
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
    const cartOpts = item.listed_product_id ? { listedOnly: true } : { customOnly: true };
    return success(res, await buildCartResponse(req.user.id, cartOpts), 'Quantity increased');
  } catch (err) { next(err); }
};

exports.decreaseQuantity = async (req, res, next) => {
  try {
    const item = await cartModel.getItemById(req.params.id, req.user.id);
    if (!item) return notFound(res, 'Cart item not found');
    const currentQty = Number(item.quantity || 1);
    const nextQty = currentQty - 1;
    const cartOpts = item.listed_product_id ? { listedOnly: true } : { customOnly: true };

    if (nextQty <= 0) {
      await cartModel.removeItem(req.params.id, req.user.id);
      return success(res, await buildCartResponse(req.user.id, cartOpts), 'Item removed from cart');
    }

    await cartModel.updateItem(req.params.id, { quantity: nextQty });
    return success(res, await buildCartResponse(req.user.id, cartOpts), 'Quantity decreased');
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
    const cartOpts = item.listed_product_id ? { listedOnly: true } : { customOnly: true };
    return success(res, await buildCartResponse(req.user.id, cartOpts), 'Quantity updated');
  } catch (err) { next(err); }
};
