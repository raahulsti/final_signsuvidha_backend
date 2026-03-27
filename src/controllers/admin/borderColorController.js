const borderColorModel = require('../../models/borderColorModel');
const { success, created, notFound } = require('../../utils/response');

exports.getAll = async (req, res, next) => {
  try { return success(res, await borderColorModel.getAll()); } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { product_type_ids, ...colorData } = req.body;
    const result = await borderColorModel.create(colorData);
    if (product_type_ids?.length) await borderColorModel.assignProducts(result.insertId, product_type_ids);
    return created(res, { id: result.insertId }, 'Border color created successfully');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await borderColorModel.getById(req.params.id);
    if (!existing) return notFound(res, 'Border color not found');
    const { product_type_ids, ...colorData } = req.body;
    await borderColorModel.update(req.params.id, colorData);
    if (product_type_ids) await borderColorModel.assignProducts(req.params.id, product_type_ids);
    return success(res, {}, 'Border color updated successfully');
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    if (!await borderColorModel.getById(req.params.id)) return notFound(res, 'Border color not found');
    await borderColorModel.remove(req.params.id);
    return success(res, {}, 'Border color deleted successfully');
  } catch (err) { next(err); }
};

exports.assignProducts = async (req, res, next) => {
  try {
    const { product_type_ids } = req.body;
    if (!Array.isArray(product_type_ids)) return notFound(res, 'product_type_ids array required');
    await borderColorModel.assignProducts(req.params.id, product_type_ids);
    return success(res, {}, 'Products assigned to border color');
  } catch (err) { next(err); }
};
