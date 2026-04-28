const model = require('../../models/illuminationOptionModel');
const { success, created, notFound } = require('../../utils/response');
const { deleteFromS3 } = require('../../config/aws');

exports.getAll = async (req, res, next) => {
  try {
    const { product_type_id, category, is_active } = req.query;
    return success(
      res,
      await model.getAll({
        productTypeId: product_type_id,
        category,
        isActive: is_active !== undefined ? is_active === 'true' : undefined,
      })
    );
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const row = await model.getById(req.params.id);
    if (!row) return notFound(res, 'Illumination option not found');
    return success(res, row);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.preview_image_url = req.file.location;
    const result = await model.create(data);
    return created(res, { id: result.insertId }, 'Illumination option created');
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await model.getById(req.params.id);
    if (!existing) return notFound(res, 'Illumination option not found');
    const data = { ...req.body };
    if (req.file) {
      if (existing.preview_image_url) await deleteFromS3(existing.preview_image_url);
      data.preview_image_url = req.file.location;
    }
    await model.update(req.params.id, data);
    return success(res, {}, 'Illumination option updated');
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const existing = await model.getById(req.params.id);
    if (!existing) return notFound(res, 'Illumination option not found');
    if (existing.preview_image_url) await deleteFromS3(existing.preview_image_url);
    await model.remove(req.params.id);
    return success(res, {}, 'Illumination option deleted');
  } catch (err) {
    next(err);
  }
};
