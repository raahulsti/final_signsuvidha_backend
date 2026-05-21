const pylonModel = require('../../models/pylonModel');
const { success, notFound } = require('../../utils/response');

exports.getAll = async (req, res, next) => {
  try {
    const { product_type_id } = req.query;
    const rows = await pylonModel.getActiveList({ productTypeId: product_type_id });
    return success(res, rows);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const row = await pylonModel.getPublicById(req.params.id);
    if (!row) return notFound(res, 'Pylon not found');
    return success(res, row);
  } catch (err) { next(err); }
};
