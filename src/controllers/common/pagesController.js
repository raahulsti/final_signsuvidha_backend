const cmsPageModel = require('../../models/cmsPageModel');
const { success, notFound } = require('../../utils/response');

/** Public: GET /api/common/pages/:slug */
exports.getBySlug = async (req, res, next) => {
  try {
    const row = await cmsPageModel.getBySlug(req.params.slug, { activeOnly: true });
    if (!row) return notFound(res, 'Page not found');
    return success(res, {
      slug:    row.slug,
      title:   row.title,
      content: row.content || '',
    });
  } catch (err) { next(err); }
};
