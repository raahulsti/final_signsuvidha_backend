const elementModel = require('../../models/elementModel');
const { success, created, notFound, paginated } = require('../../utils/response');
const { getPagination, getPaginationMeta } = require('../../utils/helpers');
const { deleteFromS3 } = require('../../config/aws');

exports.getAll = async (req, res, next) => {
  try {
    const { product_type_id, element_type_id, is_active, page = 1, limit = 20 } = req.query;
    const { offset, limit: lim } = getPagination(page, limit);
    const { rows, total } = await elementModel.getAll({
      productTypeId: product_type_id, elementTypeId: element_type_id,
      isActive: is_active !== undefined ? is_active === 'true' : undefined,
      offset, limit: lim,
    });
    return paginated(res, rows, getPaginationMeta(total, page, lim));
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const el = await elementModel.getById(req.params.id);
    if (!el) return notFound(res, 'Element not found');
    return success(res, el);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    if (!req.file) return notFound(res, 'Image file is required');
    req.body.file_url = req.body.thumbnail_url = req.file.location;
    const result = await elementModel.create(req.body);
    return created(res, { id: result.insertId }, 'Element created successfully');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const el = await elementModel.getById(req.params.id);
    if (!el) return notFound(res, 'Element not found');
    if (req.file) {
      if (el.file_url) await deleteFromS3(el.file_url);
      req.body.file_url = req.body.thumbnail_url = req.file.location;
    }
    await elementModel.update(req.params.id, req.body);
    return success(res, {}, 'Element updated');
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const el = await elementModel.getById(req.params.id);
    if (!el) return notFound(res, 'Element not found');
    if (el.file_url) await deleteFromS3(el.file_url);
    await elementModel.remove(req.params.id);
    return success(res, {}, 'Element deleted');
  } catch (err) { next(err); }
};
