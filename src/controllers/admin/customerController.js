const userModel = require('../../models/userModel');
const orderModel = require('../../models/orderModel');
const { success, notFound, paginated } = require('../../utils/response');
const { getPagination, getPaginationMeta } = require('../../utils/helpers');
const { enrichOrdersForPanel } = require('../../services/orderResponseService');

exports.getAll = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const { offset, limit: lim } = getPagination(page, limit);
    const { rows, total } = await userModel.getCustomers({ search, offset, limit: lim });
    return paginated(res, rows, getPaginationMeta(total, page, lim));
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const customer = await userModel.getCustomerById(req.params.id);
    if (!customer) return notFound(res, 'Customer not found');
    const stats = await orderModel.getCustomerStats(customer.id);
    return success(res, { ...customer, stats });
  } catch (err) { next(err); }
};

exports.getOrders = async (req, res, next) => {
  try {
    const customer = await userModel.getCustomerById(req.params.id);
    if (!customer) return notFound(res, 'Customer not found');
    const { status, page = 1, limit = 20 } = req.query;
    const { offset, limit: lim } = getPagination(page, limit);
    const { rows, total } = await orderModel.getByCustomer({ userId: customer.id, status, offset, limit: lim });
    const enriched = await enrichOrdersForPanel(rows);
    return paginated(res, enriched, getPaginationMeta(total, page, lim));
  } catch (err) { next(err); }
};
