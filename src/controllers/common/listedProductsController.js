const listedProductModel = require('../../models/listedProductModel');
const { success, notFound } = require('../../utils/response');

exports.getAll = async (req, res, next) => {
  try {
    const { product_type_id, is_best_seller } = req.query;
    const rows = await listedProductModel.getAll({
      activeOnly: true,
      productTypeId: product_type_id,
    });
    const filtered = is_best_seller
      ? rows.filter((r) => r.is_best_seller)
      : rows;
    return success(res, filtered);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const row = await listedProductModel.getPublicById(req.params.id);
    if (!row) return notFound(res, 'Listed product not found');
    return success(res, row);
  } catch (err) { next(err); }
};
