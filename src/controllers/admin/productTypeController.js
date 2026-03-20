const productTypeModel = require('../../models/productTypeModel');
const { success, notFound } = require('../../utils/response');

exports.getAll = async (req, res, next) => {
  try { return success(res, await productTypeModel.getAll()); } catch (err) { next(err); }
};
exports.update = async (req, res, next) => {
  try {
    if (!await productTypeModel.getById(req.params.id)) return notFound(res, 'Product type not found');
    await productTypeModel.update(req.params.id, req.body);
    return success(res, {}, 'Product type updated');
  } catch (err) { next(err); }
};
