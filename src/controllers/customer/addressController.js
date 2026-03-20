const addressModel = require('../../models/addressModel');
const { success, created, notFound } = require('../../utils/response');

exports.getAll = async (req, res, next) => {
  try { return success(res, await addressModel.getAll(req.user.id)); } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const addr = await addressModel.getById(req.params.id, req.user.id);
    if (!addr) return notFound(res, 'Address not found');
    return success(res, addr);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const result = await addressModel.create({ ...req.body, user_id: req.user.id });
    if (req.body.is_default) await addressModel.setDefault(result.insertId, req.user.id);
    return created(res, { id: result.insertId }, 'Address added successfully');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const addr = await addressModel.getById(req.params.id, req.user.id);
    if (!addr) return notFound(res, 'Address not found');
    await addressModel.update(req.params.id, req.user.id, req.body);
    if (req.body.is_default) await addressModel.setDefault(req.params.id, req.user.id);
    return success(res, {}, 'Address updated successfully');
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    if (!await addressModel.getById(req.params.id, req.user.id)) return notFound(res, 'Address not found');
    await addressModel.remove(req.params.id, req.user.id);
    return success(res, {}, 'Address deleted');
  } catch (err) { next(err); }
};
