const colorModel = require('../../models/colorModel');
const { success, created, notFound } = require('../../utils/response');

exports.getAll = async (req, res, next) => {
  try { return success(res, await colorModel.getAll()); } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { product_type_ids, ...colorData } = req.body;
    const result = await colorModel.create(colorData);
    if (product_type_ids?.length) await colorModel.assignProducts(result.insertId, product_type_ids);
    return created(res, { id: result.insertId }, 'Color created successfully');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await colorModel.getById(req.params.id);
    if (!existing) return notFound(res, 'Color not found');
    const { product_type_ids, ...colorData } = req.body;
    await colorModel.update(req.params.id, colorData);
    if (product_type_ids) await colorModel.assignProducts(req.params.id, product_type_ids);
    return success(res, {}, 'Color updated successfully');
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    if (!await colorModel.getById(req.params.id)) return notFound(res, 'Color not found');
    await colorModel.remove(req.params.id);
    return success(res, {}, 'Color deleted successfully');
  } catch (err) { next(err); }
};

exports.assignProducts = async (req, res, next) => {
  try {
    const { product_type_ids } = req.body;
    if (!Array.isArray(product_type_ids)) return notFound(res, 'product_type_ids array required');
    await colorModel.assignProducts(req.params.id, product_type_ids);
    return success(res, {}, 'Products assigned to color');
  } catch (err) { next(err); }
};
