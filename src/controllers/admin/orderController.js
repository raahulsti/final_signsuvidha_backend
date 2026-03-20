const orderModel = require('../../models/orderModel');
const { success, notFound, paginated } = require('../../utils/response');
const { getPagination, getPaginationMeta } = require('../../utils/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const { status, vendor_id, page = 1, limit = 20 } = req.query;
    const { offset, limit: lim } = getPagination(page, limit);
    const { rows, total } = await orderModel.getAll({ status, vendorId: vendor_id, offset, limit: lim });
    return paginated(res, rows, getPaginationMeta(total, page, lim));
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const order = await orderModel.getById(req.params.id);
    if (!order) return notFound(res, 'Order not found');
    const items = await orderModel.getOrderItems(order.id);
    return success(res, { ...order, items });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    if (!await orderModel.getById(req.params.id)) return notFound(res, 'Order not found');
    await orderModel.updateStatus(req.params.id, req.body.status);
    return success(res, {}, 'Order status updated');
  } catch (err) { next(err); }
};
