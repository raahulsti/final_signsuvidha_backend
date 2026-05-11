const baseModel = require('../../models/baseModel');
const { success, created, notFound, paginated } = require('../../utils/response');
const { getPagination, getPaginationMeta } = require('../../utils/helpers');
const { deleteFromS3 } = require('../../config/aws');

exports.getAll = async (req, res, next) => {
  try {
    const { product_type_id, is_active, page = 1, limit = 20 } = req.query;
    const { offset, limit: lim } = getPagination(page, limit);
    const { rows, total } = await baseModel.getAll({
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
    const row = await baseModel.getById(req.params.id);
    if (!row) return notFound(res, 'Base not found');
    return success(res, row);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) { data.file_url = req.file.location; data.thumbnail_url = req.file.location; }
    const result = await baseModel.create(data);
    return created(res, { id: result.insertId }, 'Base created successfully');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await baseModel.getById(req.params.id);
    if (!existing) return notFound(res, 'Base not found');
    if (req.file) {
      if (existing.file_url) await deleteFromS3(existing.file_url);
      req.body.file_url = req.body.thumbnail_url = req.file.location;
    }
    await baseModel.update(req.params.id, req.body);
    return success(res, {}, 'Base updated successfully');
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const existing = await baseModel.getById(req.params.id);
    if (!existing) return notFound(res, 'Base not found');
    if (existing.file_url) await deleteFromS3(existing.file_url);
    await baseModel.remove(req.params.id);
    return success(res, {}, 'Base deleted successfully');
  } catch (err) { next(err); }
};
