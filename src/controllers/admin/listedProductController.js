const model = require('../../models/listedProductModel');
const { success, created, notFound } = require('../../utils/response');
const { deleteFromS3 } = require('../../config/aws');
const { createUploader, ALLOWED_IMAGE_TYPES } = require('../../middleware/uploadS3');
const { S3_FOLDERS } = require('../../utils/constants');

exports.getAll = async (req, res, next) => { try { return success(res, await model.getAll()); } catch (err) { next(err); } };
exports.getOne = async (req, res, next) => { try { const i = await model.getById(req.params.id); if (!i) return notFound(res, 'Not found'); return success(res, i); } catch (err) { next(err); } };
exports.create = async (req, res, next) => {
  try {
    if (req.file) req.body.thumbnail_url = req.file.location;
    const r = await model.create(req.body);
    return created(res, { id: r.insertId }, 'Listed product created');
  } catch (err) { next(err); }
};
exports.update = async (req, res, next) => {
  try {
    const existing = await model.getById(req.params.id);
    if (!existing) return notFound(res, 'Not found');
    if (req.file) {
      if (existing.thumbnail_url) await deleteFromS3(existing.thumbnail_url);
      req.body.thumbnail_url = req.file.location;
    }
    await model.update(req.params.id, req.body);
    return success(res, {}, 'Updated');
  } catch (err) { next(err); }
};
exports.delete = async (req, res, next) => {
  try {
    const existing = await model.getById(req.params.id);
    if (!existing) return notFound(res, 'Not found');
    if (existing.thumbnail_url) await deleteFromS3(existing.thumbnail_url);
    await model.remove(req.params.id);
    return success(res, {}, 'Deleted');
  } catch (err) { next(err); }
};
