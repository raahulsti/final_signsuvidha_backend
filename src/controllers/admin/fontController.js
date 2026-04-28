const fontModel = require('../../models/fontModel');
const { success, created, notFound } = require('../../utils/response');
const { deleteFromS3 } = require('../../config/aws');

exports.getAll = async (req, res, next) => {
  try { return success(res, await fontModel.getAll(req.query.product_type_id)); } catch (err) { next(err); }
};

const normalizeProductTypePrices = (body) => {
  if (Array.isArray(body.product_type_prices)) return body.product_type_prices;
  if (typeof body.product_type_prices === 'string') {
    try {
      const parsed = JSON.parse(body.product_type_prices);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {
      return [];
    }
  }
  // Backward compatibility with old payload style: product_type_ids only.
  const ids = body.product_type_ids || body['product_type_ids[]'];
  if (Array.isArray(ids)) {
    return ids.map((id) => ({ product_type_id: Number(id), admin_price_extra: 0 }));
  }
  if (ids !== undefined) {
    return [{ product_type_id: Number(ids), admin_price_extra: 0 }];
  }
  return [];
};

exports.create = async (req, res, next) => {
  try {
    const { product_type_ids, product_type_prices, ...data } = req.body;
    if (req.file) data.file_url = req.file.location;
    const result = await fontModel.create(data);
    const normalized = normalizeProductTypePrices({ product_type_ids, product_type_prices });
    if (normalized.length) await fontModel.replaceProductTypePrices(result.insertId, normalized);
    return created(res, { id: result.insertId }, 'Font created');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const font = await fontModel.getById(req.params.id);
    if (!font) return notFound(res, 'Font not found');
    const { product_type_ids, product_type_prices, ...data } = req.body;
    if (req.file) {
      if (font.file_url) await deleteFromS3(font.file_url);
      data.file_url = req.file.location;
    }
    await fontModel.update(req.params.id, data);
    if (product_type_ids !== undefined || product_type_prices !== undefined) {
      const normalized = normalizeProductTypePrices({ product_type_ids, product_type_prices });
      await fontModel.replaceProductTypePrices(req.params.id, normalized);
    }
    return success(res, {}, 'Font updated');
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const font = await fontModel.getById(req.params.id);
    if (!font) return notFound(res, 'Font not found');
    if (font.file_url) await deleteFromS3(font.file_url);
    await fontModel.remove(req.params.id);
    return success(res, {}, 'Font deleted');
  } catch (err) { next(err); }
};

exports.assignProducts = async (req, res, next) => {
  try {
    await fontModel.assignProducts(req.params.id, req.body.product_type_ids || []);
    return success(res, {}, 'Products assigned to font');
  } catch (err) { next(err); }
};
