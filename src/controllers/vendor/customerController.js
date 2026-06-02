const vendorModel = require('../../models/vendorModel');
const userModel = require('../../models/userModel');
const orderModel = require('../../models/orderModel');
const { success, notFound, paginated } = require('../../utils/response');
const { getPagination, getPaginationMeta } = require('../../utils/helpers');
const { enrichOrdersForPanel } = require('../../services/orderResponseService');

exports.getAll = async (req, res, next) => {
  try {
    const vendor = await vendorModel.getByUserId(req.user.id);
    if (!vendor) return notFound(res, 'Vendor not found');
    const { search, page = 1, limit = 20 } = req.query;
    const { offset, limit: lim } = getPagination(page, limit);
    const { rows, total } = await orderModel.getVendorCustomers({ vendorId: vendor.id, search, offset, limit: lim });
    return paginated(res, rows, getPaginationMeta(total, page, lim));
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const vendor = await vendorModel.getByUserId(req.user.id);
    if (!vendor) return notFound(res, 'Vendor not found');
    const customer = await userModel.getCustomerById(req.params.id);
    if (!customer) return notFound(res, 'Customer not found');
    const stats = await orderModel.getCustomerVendorStats(customer.id, vendor.id);
    // Only expose customers who actually ordered from this vendor.
    if (!stats || Number(stats.order_count) === 0) return notFound(res, 'Customer not found');
    return success(res, { ...customer, stats });
  } catch (err) { next(err); }
};

exports.getOrders = async (req, res, next) => {
  try {
    const vendor = await vendorModel.getByUserId(req.user.id);
    if (!vendor) return notFound(res, 'Vendor not found');
    const { status, page = 1, limit = 20 } = req.query;
    const { offset, limit: lim } = getPagination(page, limit);
    const { rows, total } = await orderModel.getByCustomerAndVendor({
      userId: req.params.id, vendorId: vendor.id, status, offset, limit: lim,
    });
    const enriched = await enrichOrdersForPanel(rows);
    return paginated(res, enriched, getPaginationMeta(total, page, lim));
  } catch (err) { next(err); }
};
