const orderModel  = require('../../models/orderModel');
const vendorModel = require('../../models/vendorModel');
const { success, notFound, paginated, forbidden } = require('../../utils/response');
const { getPagination, getPaginationMeta } = require('../../utils/helpers');
const { ORDER_STATUS } = require('../../utils/constants');

exports.getOrders = async (req, res, next) => {
  try {
    const vendor = await vendorModel.getByUserId(req.user.id);
    if (!vendor) return notFound(res, 'Vendor not found');
    const { status, page = 1, limit = 20 } = req.query;
    const { offset, limit: lim } = getPagination(page, limit);
    const { rows, total } = await orderModel.getByVendor({ vendorId: vendor.id, status, offset, limit: lim });
    return paginated(res, rows, getPaginationMeta(total, page, lim));
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const vendor = await vendorModel.getByUserId(req.user.id);
    if (!vendor) return notFound(res, 'Vendor not found');
    const order = await orderModel.getById(req.params.id);
    if (!order || order.vendor_id !== vendor.id) return notFound(res, 'Order not found');
    const items = await orderModel.getOrderItems(order.id);
    return success(res, { ...order, items });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const vendor = await vendorModel.getByUserId(req.user.id);
    if (!vendor) return notFound(res, 'Vendor not found');
    const order = await orderModel.getById(req.params.id);
    if (!order || order.vendor_id !== vendor.id) return notFound(res, 'Order not found');

    const { status } = req.body;
    // Vendor can only move to: confirmed, processing, shipped
    const vendorAllowed = ['confirmed','processing','shipped'];
    if (!vendorAllowed.includes(status))
      return forbidden(res, 'Vendors can only update status to: confirmed, processing, shipped');

    await orderModel.updateStatus(req.params.id, status);
    return success(res, {}, 'Order status updated');
  } catch (err) { next(err); }
};
