const addBorderModel = require('../../models/addBorderModel');
const { success, created, notFound, paginated } = require('../../utils/response');
const { getPagination, getPaginationMeta } = require('../../utils/helpers');
const { deleteFromS3 } = require('../../config/aws');

exports.getAll = async (req, res, next) => {
  try {
    const { product_type_id, is_active, page = 1, limit = 50 } = req.query;
    const { offset, limit: lim } = getPagination(page, limit);
    const { rows, total } = await addBorderModel.getAll({
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
    const row = await addBorderModel.getById(req.params.id);
    if (!row) return notFound(res, 'Add border option not found');
    return success(res, row);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) { data.file_url = req.file.location; data.thumbnail_url = req.file.location; }
    const result = await addBorderModel.create(data);
    return created(res, { id: result.insertId }, 'Add border option created');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await addBorderModel.getById(req.params.id);
    if (!existing) return notFound(res, 'Add border option not found');
    if (req.file) {
      if (existing.file_url) await deleteFromS3(existing.file_url);
      req.body.file_url = req.body.thumbnail_url = req.file.location;
    }
    await addBorderModel.update(req.params.id, req.body);
    return success(res, {}, 'Add border option updated');
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const existing = await addBorderModel.getById(req.params.id);
    if (!existing) return notFound(res, 'Add border option not found');
    if (existing.file_url) await deleteFromS3(existing.file_url);
    await addBorderModel.remove(req.params.id);
    return success(res, {}, 'Add border option deleted');
  } catch (err) { next(err); }
};
