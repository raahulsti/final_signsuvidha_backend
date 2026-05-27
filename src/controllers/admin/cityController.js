const model = require('../../models/cityModel');
const stateModel = require('../../models/stateModel');
const { success, created, notFound, error } = require('../../utils/response');

exports.getAll = async (req, res, next) => {
  try {
    const { state_id } = req.query;
    return success(res, await model.getAll({ stateId: state_id }));
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const row = await model.getById(req.params.id);
    if (!row) return notFound(res, 'City not found');
    return success(res, row);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    if (!await stateModel.getById(req.body.state_id)) {
      return error(res, 'Invalid state_id', 400);
    }
    const result = await model.create(req.body);
    return created(res, { id: result.insertId }, 'City created');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    if (!await model.getById(req.params.id)) return notFound(res, 'City not found');
    if (req.body.state_id && !await stateModel.getById(req.body.state_id)) {
      return error(res, 'Invalid state_id', 400);
    }
    await model.update(req.params.id, req.body);
    return success(res, {}, 'City updated');
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    if (!await model.getById(req.params.id)) return notFound(res, 'City not found');
    await model.remove(req.params.id);
    return success(res, {}, 'City deleted');
  } catch (err) { next(err); }
};
