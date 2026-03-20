const vendorModel = require('../../models/vendorModel');
const { success, notFound, paginated } = require('../../utils/response');
const { getPagination, getPaginationMeta } = require('../../utils/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const { is_approved, is_active, page = 1, limit = 20 } = req.query;
    const { offset, limit: lim } = getPagination(page, limit);
    const { rows, total } = await vendorModel.getAll({
      isApproved: is_approved !== undefined ? is_approved === 'true' : undefined,
      isActive:   is_active   !== undefined ? is_active   === 'true' : undefined,
      offset, limit: lim,
    });
    return paginated(res, rows, getPaginationMeta(total, page, lim));
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const vendor = await vendorModel.getById(req.params.id);
    if (!vendor) return notFound(res, 'Vendor not found');
    return success(res, vendor);
  } catch (err) { next(err); }
};

exports.approve = async (req, res, next) => {
  try {
    await vendorModel.approve(req.params.id, req.user.id);
    return success(res, {}, 'Vendor approved successfully');
  } catch (err) { next(err); }
};

exports.reject = async (req, res, next) => {
  try {
    await vendorModel.reject(req.params.id);
    return success(res, {}, 'Vendor rejected');
  } catch (err) { next(err); }
};

exports.toggleBlock = async (req, res, next) => {
  try {
    const vendor = await vendorModel.getById(req.params.id);
    if (!vendor) return notFound(res, 'Vendor not found');
    await vendorModel.toggleActive(req.params.id, !vendor.is_active);
    return success(res, {}, `Vendor ${vendor.is_active ? 'blocked' : 'unblocked'} successfully`);
  } catch (err) { next(err); }
};
