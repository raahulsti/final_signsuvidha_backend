const model = require('../../models/stateModel');
const { success, created, notFound } = require('../../utils/response');

exports.getAll = async (req, res, next) => {
  try { return success(res, await model.getAll()); } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const row = await model.getById(req.params.id);
    if (!row) return notFound(res, 'State not found');
    return success(res, row);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const result = await model.create(req.body);
    return created(res, { id: result.insertId }, 'State created');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    if (!await model.getById(req.params.id)) return notFound(res, 'State not found');
    await model.update(req.params.id, req.body);
    return success(res, {}, 'State updated');
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    if (!await model.getById(req.params.id)) return notFound(res, 'State not found');
    await model.remove(req.params.id);
    return success(res, {}, 'State deleted');
  } catch (err) { next(err); }
};
