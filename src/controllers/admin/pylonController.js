const pylonModel = require('../../models/pylonModel');
const { success, created, notFound, paginated } = require('../../utils/response');
const { getPagination, getPaginationMeta } = require('../../utils/helpers');
const { deleteFromS3 } = require('../../config/aws');

exports.getAll = async (req, res, next) => {
  try {
    const { product_type_id, is_active, page = 1, limit = 50 } = req.query;
    const { offset, limit: lim } = getPagination(page, limit);
    const { rows, total } = await pylonModel.getAll({
      productTypeId: product_type_id,
      isActive: is_active !== undefined ? is_active === 'true' : undefined,
      offset,
      limit: lim,
    });
    const data = await Promise.all(rows.map((r) => pylonModel.toPublic(r, { activeCategoriesOnly: false })));
    return paginated(res, data, getPaginationMeta(total, page, lim));
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const row = await pylonModel.getById(req.params.id);
    if (!row) return notFound(res, 'Pylon not found');
    return success(res, await pylonModel.toPublic(row, { activeCategoriesOnly: false }));
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.file_url = req.file.location;
      data.thumbnail_url = req.file.location;
    }
    const id = await pylonModel.create(data);
    return created(res, { id }, 'Pylon created');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await pylonModel.getById(req.params.id);
    if (!existing) return notFound(res, 'Pylon not found');
    if (req.file) {
      if (existing.file_url) await deleteFromS3(existing.file_url);
      req.body.file_url = req.body.thumbnail_url = req.file.location;
    }
    await pylonModel.update(req.params.id, req.body);
    return success(res, await pylonModel.toPublic(await pylonModel.getById(req.params.id), { activeCategoriesOnly: false }), 'Pylon updated');
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const existing = await pylonModel.getById(req.params.id);
    if (!existing) return notFound(res, 'Pylon not found');
    if (existing.file_url) await deleteFromS3(existing.file_url);
    await pylonModel.remove(req.params.id);
    return success(res, {}, 'Pylon deleted');
  } catch (err) { next(err); }
};

exports.getCategories = async (req, res, next) => {
  try {
    const pylon = await pylonModel.getById(req.params.pylonId);
    if (!pylon) return notFound(res, 'Pylon not found');
    const categories = await pylonModel.getCategories(req.params.pylonId);
    return success(res, categories);
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const pylon = await pylonModel.getById(req.params.pylonId);
    if (!pylon) return notFound(res, 'Pylon not found');
    const result = await pylonModel.createCategory({ ...req.body, pylon_id: req.params.pylonId });
    return created(res, { id: result.insertId }, 'Pylon category created');
  } catch (err) { next(err); }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await pylonModel.getCategoryById(req.params.categoryId);
    if (!category || String(category.pylon_id) !== String(req.params.pylonId)) {
      return notFound(res, 'Pylon category not found');
    }
    await pylonModel.updateCategory(req.params.categoryId, req.body);
    return success(res, await pylonModel.getCategoryById(req.params.categoryId), 'Pylon category updated');
  } catch (err) { next(err); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await pylonModel.getCategoryById(req.params.categoryId);
    if (!category || String(category.pylon_id) !== String(req.params.pylonId)) {
      return notFound(res, 'Pylon category not found');
    }
    await pylonModel.removeCategory(req.params.categoryId);
    return success(res, {}, 'Pylon category deleted');
  } catch (err) { next(err); }
};
