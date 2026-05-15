const materialStyleModel = require('../../models/materialStyleModel');
const { success, created, notFound, paginated } = require('../../utils/response');
const { getPagination, getPaginationMeta } = require('../../utils/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const { product_type_id, is_active, page = 1, limit = 20 } = req.query;
    const { offset, limit: lim } = getPagination(page, limit);
    const { rows, total } = await materialStyleModel.getAll({
      productTypeId: product_type_id,
      isActive: is_active !== undefined ? is_active === 'true' : undefined,
      offset,
      limit: lim,
    });
    return paginated(res, rows, getPaginationMeta(total, page, lim));
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const row = await materialStyleModel.getById(req.params.id);
    if (!row) return notFound(res, 'Material style not found');
    return success(res, row);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const result = await materialStyleModel.create(req.body);
    return created(res, { id: result.insertId }, 'Material style created successfully');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await materialStyleModel.getById(req.params.id);
    if (!existing) return notFound(res, 'Material style not found');
    await materialStyleModel.update(req.params.id, req.body);
    return success(res, {}, 'Material style updated successfully');
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const existing = await materialStyleModel.getById(req.params.id);
    if (!existing) return notFound(res, 'Material style not found');
    await materialStyleModel.remove(req.params.id);
    return success(res, {}, 'Material style deleted successfully');
  } catch (err) { next(err); }
};
