const fontModel = require('../../models/fontModel');
const { success, created, notFound } = require('../../utils/response');
const { deleteFromS3 } = require('../../config/aws');

exports.getAll = async (req, res, next) => {
  try { return success(res, await fontModel.getAll()); } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { product_type_ids, ...data } = req.body;
    if (req.file) data.file_url = req.file.location;
    const result = await fontModel.create(data);
    if (product_type_ids?.length) await fontModel.assignProducts(result.insertId, product_type_ids);
    return created(res, { id: result.insertId }, 'Font created');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const font = await fontModel.getById(req.params.id);
    if (!font) return notFound(res, 'Font not found');
    const { product_type_ids, ...data } = req.body;
    if (req.file) {
      if (font.file_url) await deleteFromS3(font.file_url);
      data.file_url = req.file.location;
    }
    await fontModel.update(req.params.id, data);
    if (product_type_ids) await fontModel.assignProducts(req.params.id, product_type_ids);
    return success(res, {}, 'Font updated');
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const font = await fontModel.getById(req.params.id);
    if (!font) return notFound(res, 'Font not found');
    if (font.file_url) await deleteFromS3(font.file_url);
    await fontModel.remove(req.params.id);
    return success(res, {}, 'Font deleted');
  } catch (err) { next(err); }
};

exports.assignProducts = async (req, res, next) => {
  try {
    await fontModel.assignProducts(req.params.id, req.body.product_type_ids || []);
    return success(res, {}, 'Products assigned to font');
  } catch (err) { next(err); }
};
