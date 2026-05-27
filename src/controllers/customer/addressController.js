const addressModel = require('../../models/addressModel');
const { resolveStateCity, LocationError } = require('../../services/locationService');
const { success, created, notFound, error } = require('../../utils/response');

const buildAddressPayload = async (body) => {
  const { state_id, city_id, ...rest } = body;
  const location = await resolveStateCity(state_id, city_id);
  return { ...rest, ...location };
};

exports.getAll = async (req, res, next) => {
  try { return success(res, await addressModel.getAll(req.user.id)); } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const addr = await addressModel.getActiveById(req.params.id, req.user.id);
    if (!addr) return notFound(res, 'Address not found');
    return success(res, addr);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const payload = await buildAddressPayload(req.body);
    const result = await addressModel.create({ ...payload, user_id: req.user.id });
    if (req.body.is_default) await addressModel.setDefault(result.insertId, req.user.id);
    return created(res, { id: result.insertId }, 'Address added successfully');
  } catch (err) {
    if (err instanceof LocationError) return error(res, err.message, err.statusCode);
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const addr = await addressModel.getActiveById(req.params.id, req.user.id);
    if (!addr) return notFound(res, 'Address not found');

    let payload = { ...req.body };
    if (req.body.state_id !== undefined || req.body.city_id !== undefined) {
      const stateId = req.body.state_id ?? addr.state_id;
      const cityId = req.body.city_id ?? addr.city_id;
      const location = await resolveStateCity(stateId, cityId);
      payload = { ...payload, ...location };
    }

    await addressModel.update(req.params.id, req.user.id, payload);
    if (req.body.is_default) await addressModel.setDefault(req.params.id, req.user.id);
    return success(res, {}, 'Address updated successfully');
  } catch (err) {
    if (err instanceof LocationError) return error(res, err.message, err.statusCode);
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    if (!await addressModel.getActiveById(req.params.id, req.user.id)) return notFound(res, 'Address not found');
    await addressModel.deactivate(req.params.id, req.user.id);
    return success(res, {}, 'Address removed successfully');
  } catch (err) { next(err); }
};
