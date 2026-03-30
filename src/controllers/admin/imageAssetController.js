const imageAssetModel = require('../../models/imageAssetModel');
const { success, created, notFound, paginated } = require('../../utils/response');
const { getPagination, getPaginationMeta } = require('../../utils/helpers');
const { deleteFromS3 } = require('../../config/aws');

exports.getAll = async (req, res, next) => {
  try {
    const { product_type_id, image_type, is_active, page = 1, limit = 20 } = req.query;
    const { offset, limit: lim } = getPagination(page, limit);
    const { rows, total } = await imageAssetModel.getAll({
      productTypeId: product_type_id ? Number(product_type_id) : undefined,
      imageType: image_type ? String(image_type).trim() : undefined,
      isActive: is_active !== undefined ? is_active === 'true' : undefined,
      offset,
      limit: lim,
    });
    return paginated(res, rows, getPaginationMeta(total, page, lim));
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const row = await imageAssetModel.getById(req.params.id);
    if (!row) return notFound(res, 'Image asset not found');
    return success(res, row);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Image file is required' });
    const data = {
      ...req.body,
      image_url: req.file.location,
      thumbnail_url: req.file.location,
    };
    const result = await imageAssetModel.create(data);
    return created(res, { id: result.insertId }, 'Image asset created successfully');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await imageAssetModel.getById(req.params.id);
    if (!existing) return notFound(res, 'Image asset not found');

    const data = { ...req.body };
    if (req.file) {
      if (existing.image_url) await deleteFromS3(existing.image_url);
      data.image_url = req.file.location;
      data.thumbnail_url = req.file.location;
    }
    await imageAssetModel.update(req.params.id, data);
    return success(res, {}, 'Image asset updated successfully');
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const existing = await imageAssetModel.getById(req.params.id);
    if (!existing) return notFound(res, 'Image asset not found');
    if (existing.image_url) await deleteFromS3(existing.image_url);
    await imageAssetModel.remove(req.params.id);
    return success(res, {}, 'Image asset deleted successfully');
  } catch (err) { next(err); }
};
