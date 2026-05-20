const db              = require('../../config/db');
const productTypeModel = require('../../models/productTypeModel');
const materialModel   = require('../../models/materialModel');
const materialStyleModel = require('../../models/materialStyleModel');
const frameModel = require('../../models/frameModel');
const wallpaperModel = require('../../models/wallpaperModel');
const addBorderModel = require('../../models/addBorderModel');
const lollipopElementModel = require('../../models/lollipopElementModel');
const baseModel       = require('../../models/baseModel');
const thicknessModel  = require('../../models/thicknessModel');
const elementModel    = require('../../models/elementModel');
const colorModel      = require('../../models/colorModel');
const imageAssetModel = require('../../models/imageAssetModel');
const shadowColorModel = require('../../models/shadowColorModel');
const borderColorModel = require('../../models/borderColorModel');
const baseColorModel   = require('../../models/baseColorModel');
const fontModel       = require('../../models/fontModel');
const fontSizeModel   = require('../../models/fontSizeModel');
const letterStyleModel= require('../../models/letterStyleModel');
const illuminationOptionModel = require('../../models/illuminationOptionModel');
const { success, error } = require('../../utils/response');
const { WALLPAPER_TYPES } = require('../../utils/constants');

exports.getProductTypes   = async (req, res, next) => { try { return success(res, await productTypeModel.getAll(true)); } catch(e){next(e);} };
exports.getFontSizes      = async (req, res, next) => { try { return success(res, await fontSizeModel.getAll()); } catch(e){next(e);} };
exports.getDimensionUnits = async (req, res, next) => { try { return success(res, await db.execute('SELECT * FROM dimension_units')); } catch(e){next(e);} };
exports.getShippingServices = async (req, res, next) => { try { return success(res, await db.execute('SELECT * FROM shipping_services WHERE is_active = 1')); } catch(e){next(e);} };

exports.getMaterials = async (req, res, next) => {
  try {
    const { product_type_id } = req.query;
    const { rows } = await materialModel.getAll({
      productTypeId: product_type_id,
      isActive: true,
      offset: 0,
      limit: 1000,
    });
    return success(res, rows);
  } catch(e){next(e);}
};

exports.getMaterialStyles = async (req, res, next) => {
  try {
    const { product_type_id } = req.query;
    const { rows } = await materialStyleModel.getAll({ productTypeId: product_type_id, isActive: true, offset: 0, limit: 1000 });
    return success(res, rows);
  } catch (e) { next(e); }
};

exports.getFrames = async (req, res, next) => {
  try {
    const { product_type_id } = req.query;
    const { rows } = await frameModel.getAll({ productTypeId: product_type_id, isActive: true, offset: 0, limit: 1000 });
    return success(res, rows);
  } catch (e) { next(e); }
};

exports.getAddBorders = async (req, res, next) => {
  try {
    const { product_type_id } = req.query;
    const { rows } = await addBorderModel.getAll({
      productTypeId: product_type_id,
      isActive: true,
      offset: 0,
      limit: 500,
    });
    return success(res, rows);
  } catch (e) { next(e); }
};

exports.getLollipopElements = async (req, res, next) => {
  try {
    const { product_type_id } = req.query;
    const { rows } = await lollipopElementModel.getAll({
      productTypeId: product_type_id,
      isActive: true,
      offset: 0,
      limit: 100,
    });
    return success(res, rows);
  } catch (e) { next(e); }
};

exports.getWallpapers = async (req, res, next) => {
  try {
    const { product_type_id, wallpaper_type } = req.query;
    let wallpaperTypeFilter;
    if (wallpaper_type !== undefined && wallpaper_type !== null && String(wallpaper_type).trim() !== '') {
      const t = String(wallpaper_type).toLowerCase().trim();
      if (!WALLPAPER_TYPES.includes(t)) {
        return error(res, `wallpaper_type must be one of: ${WALLPAPER_TYPES.join(', ')}`, 400);
      }
      wallpaperTypeFilter = t;
    }
    const { rows } = await wallpaperModel.getAll({
      productTypeId: product_type_id,
      wallpaperType: wallpaperTypeFilter,
      isActive: true,
      offset: 0,
      limit: 1000,
    });
    return success(res, rows);
  } catch (e) { next(e); }
};

exports.getBases = async (req, res, next) => {
  try {
    const { product_type_id } = req.query;
    const { rows } = await baseModel.getAll({ productTypeId: product_type_id, isActive: true, offset: 0, limit: 1000 });
    return success(res, rows);
  } catch (e) { next(e); }
};

exports.getThicknesses = async (req, res, next) => {
  try {
    const { product_type_id } = req.query;
    const { rows } = await thicknessModel.getAll({ productTypeId: product_type_id, isActive: true, offset: 0, limit: 1000 });
    return success(res, rows);
  } catch (e) { next(e); }
};

exports.getElements = async (req, res, next) => {
  try {
    const { product_type_id, element_type_id } = req.query;
    const { rows } = await elementModel.getAll({ productTypeId: product_type_id, elementTypeId: element_type_id, isActive: true, offset: 0, limit: 1000 });
    return success(res, rows);
  } catch(e){next(e);}
};

exports.getColors       = async (req, res, next) => { try { return success(res, await colorModel.getAll(req.query.product_type_id)); } catch(e){next(e);} };
exports.getImages       = async (req, res, next) => {
  try {
    const { product_type_id, image_type } = req.query;
    const { rows } = await imageAssetModel.getAll({
      productTypeId: product_type_id,
      imageType: image_type,
      isActive: true,
      offset: 0,
      limit: 1000,
    });
    return success(res, rows);
  } catch(e){next(e);}
};
exports.getShadowColors = async (req, res, next) => { try { return success(res, await shadowColorModel.getAll(req.query.product_type_id)); } catch(e){next(e);} };
exports.getBorderColors = async (req, res, next) => { try { return success(res, await borderColorModel.getAll(req.query.product_type_id)); } catch(e){next(e);} };
exports.getBaseColors   = async (req, res, next) => { try { return success(res, await baseColorModel.getAll(req.query.product_type_id)); } catch(e){next(e);} };
exports.getFonts        = async (req, res, next) => { try { return success(res, await fontModel.getAll(req.query.product_type_id)); } catch(e){next(e);} };
exports.getLetterStyles = async (req, res, next) => { try { return success(res, await letterStyleModel.getAll()); } catch(e){next(e);} };

exports.getIlluminationOptions = async (req, res, next) => {
  try {
    const { product_type_id, category } = req.query;
    if (!product_type_id || !category) {
      return error(res, 'product_type_id and category (lit|non_lit) are required', 400);
    }
    const rows = await illuminationOptionModel.getAll({
      productTypeId: product_type_id,
      category,
      isActive: true,
    });
    const withUnit = rows.map((row) => ({ ...row, unit: 'square feet' }));
    return success(res, withUnit);
  } catch (e) {
    next(e);
  }
};

exports.getListedProducts = async (req, res, next) => {
  try {
    const listedProductModel = require('../../models/listedProductModel');
    const { product_type_id, is_best_seller } = req.query;
    const rows = await listedProductModel.getAll({ activeOnly: true, productTypeId: product_type_id });
    const filtered = is_best_seller ? rows.filter((r) => r.is_best_seller) : rows;
    return success(res, filtered);
  } catch (e) { next(e); }
};
