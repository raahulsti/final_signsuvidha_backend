const cmsPageModel = require('../../models/cmsPageModel');
const { success, notFound, error } = require('../../utils/response');

exports.getAll = async (req, res, next) => {
  try {
    return success(res, await cmsPageModel.getAll());
  } catch (err) { next(err); }
};

exports.getBySlug = async (req, res, next) => {
  try {
    const row = await cmsPageModel.getBySlug(req.params.slug);
    if (!row) return notFound(res, 'Page not found');
    return success(res, row);
  } catch (err) { next(err); }
};

exports.updateBySlug = async (req, res, next) => {
  try {
    const existing = await cmsPageModel.getBySlug(req.params.slug);
    if (!existing) return notFound(res, 'Page not found');
    const result = await cmsPageModel.updateBySlug(req.params.slug, req.body);
    if (!result) return error(res, 'No valid fields to update', 400);
    const row = await cmsPageModel.getBySlug(req.params.slug);
    return success(res, row, 'Page updated successfully');
  } catch (err) { next(err); }
};
