const baseColorModel = require('../../models/baseColorModel');
const { success, created, notFound } = require('../../utils/response');

exports.getAll = async (req, res, next) => {
  try { return success(res, await baseColorModel.getAll()); } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { product_type_ids, ...colorData } = req.body;
    const result = await baseColorModel.create(colorData);
    if (product_type_ids?.length) await baseColorModel.assignProducts(result.insertId, product_type_ids);
    return created(res, { id: result.insertId }, 'Base color created successfully');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await baseColorModel.getById(req.params.id);
    if (!existing) return notFound(res, 'Base color not found');
    const { product_type_ids, ...colorData } = req.body;
    await baseColorModel.update(req.params.id, colorData);
    if (product_type_ids) await baseColorModel.assignProducts(req.params.id, product_type_ids);
    return success(res, {}, 'Base color updated successfully');
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    if (!await baseColorModel.getById(req.params.id)) return notFound(res, 'Base color not found');
    await baseColorModel.remove(req.params.id);
    return success(res, {}, 'Base color deleted successfully');
  } catch (err) { next(err); }
};

exports.assignProducts = async (req, res, next) => {
  try {
    const { product_type_ids } = req.body;
    if (!Array.isArray(product_type_ids)) return notFound(res, 'product_type_ids array required');
    await baseColorModel.assignProducts(req.params.id, product_type_ids);
    return success(res, {}, 'Products assigned to base color');
  } catch (err) { next(err); }
};
