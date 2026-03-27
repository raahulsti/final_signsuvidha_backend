const shadowColorModel = require('../../models/shadowColorModel');
const { success, created, notFound } = require('../../utils/response');

exports.getAll = async (req, res, next) => {
  try { return success(res, await shadowColorModel.getAll()); } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { product_type_ids, ...colorData } = req.body;
    const result = await shadowColorModel.create(colorData);
    if (product_type_ids?.length) await shadowColorModel.assignProducts(result.insertId, product_type_ids);
    return created(res, { id: result.insertId }, 'Shadow color created successfully');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await shadowColorModel.getById(req.params.id);
    if (!existing) return notFound(res, 'Shadow color not found');
    const { product_type_ids, ...colorData } = req.body;
    await shadowColorModel.update(req.params.id, colorData);
    if (product_type_ids) await shadowColorModel.assignProducts(req.params.id, product_type_ids);
    return success(res, {}, 'Shadow color updated successfully');
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    if (!await shadowColorModel.getById(req.params.id)) return notFound(res, 'Shadow color not found');
    await shadowColorModel.remove(req.params.id);
    return success(res, {}, 'Shadow color deleted successfully');
  } catch (err) { next(err); }
};

exports.assignProducts = async (req, res, next) => {
  try {
    const { product_type_ids } = req.body;
    if (!Array.isArray(product_type_ids)) return notFound(res, 'product_type_ids array required');
    await shadowColorModel.assignProducts(req.params.id, product_type_ids);
    return success(res, {}, 'Products assigned to shadow color');
  } catch (err) { next(err); }
};
