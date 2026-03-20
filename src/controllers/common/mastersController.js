const db              = require('../../config/db');
const productTypeModel = require('../../models/productTypeModel');
const materialModel   = require('../../models/materialModel');
const elementModel    = require('../../models/elementModel');
const colorModel      = require('../../models/colorModel');
const fontModel       = require('../../models/fontModel');
const fontSizeModel   = require('../../models/fontSizeModel');
const letterStyleModel= require('../../models/letterStyleModel');
const { success }     = require('../../utils/response');

exports.getProductTypes   = async (req, res, next) => { try { return success(res, await productTypeModel.getAll(true)); } catch(e){next(e);} };
exports.getFontSizes      = async (req, res, next) => { try { return success(res, await fontSizeModel.getAll()); } catch(e){next(e);} };
exports.getDimensionUnits = async (req, res, next) => { try { return success(res, await db.execute('SELECT * FROM dimension_units')); } catch(e){next(e);} };
exports.getShippingServices = async (req, res, next) => { try { return success(res, await db.execute('SELECT * FROM shipping_services WHERE is_active = 1')); } catch(e){next(e);} };

exports.getMaterials = async (req, res, next) => {
  try {
    const { product_type_id } = req.query;
    const { rows } = await materialModel.getAll({ productTypeId: product_type_id, isActive: true, offset: 0, limit: 1000 });
    return success(res, rows);
  } catch(e){next(e);}
};

exports.getElements = async (req, res, next) => {
  try {
    const { product_type_id, element_type_id } = req.query;
    const { rows } = await elementModel.getAll({ productTypeId: product_type_id, elementTypeId: element_type_id, isActive: true, offset: 0, limit: 1000 });
    return success(res, rows);
  } catch(e){next(e);}
};

exports.getColors       = async (req, res, next) => { try { return success(res, await colorModel.getAll(req.query.product_type_id)); } catch(e){next(e);} };
exports.getFonts        = async (req, res, next) => { try { return success(res, await fontModel.getAll(req.query.product_type_id)); } catch(e){next(e);} };
exports.getLetterStyles = async (req, res, next) => { try { return success(res, await letterStyleModel.getAll(req.query.product_type_id)); } catch(e){next(e);} };

exports.getListedProducts = async (req, res, next) => {
  try {
    const { product_type_id, is_best_seller } = req.query;
    const conds = ['is_active = 1']; const vals = [];
    if (product_type_id) { conds.push('product_type_id = ?'); vals.push(product_type_id); }
    if (is_best_seller)  { conds.push('is_best_seller = 1'); }
    const rows = await db.execute(`SELECT * FROM listed_products WHERE ${conds.join(' AND ')} ORDER BY sort_order ASC, is_best_seller DESC`, vals);
    return success(res, rows);
  } catch(e){next(e);}
};
