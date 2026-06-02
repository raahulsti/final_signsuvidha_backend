const db          = require('../../config/db');
const vendorModel = require('../../models/vendorModel');
const { success, notFound } = require('../../utils/response');

exports.getStats = async (req, res, next) => {
  try {
    const vendor = await vendorModel.getByUserId(req.user.id);
    if (!vendor) return notFound(res, 'Vendor not found');

    const [totalOrders, revenue, pendingOrders, recentOrders] = await Promise.all([
      db.findOne('SELECT COUNT(*) AS total FROM orders WHERE vendor_id = ?', [vendor.id]),
      db.findOne('SELECT COALESCE(SUM(total_amount),0) AS total FROM orders WHERE vendor_id = ? AND payment_status = "paid"', [vendor.id]),
      db.findOne('SELECT COUNT(*) AS total FROM orders WHERE vendor_id = ? AND status = "pending"', [vendor.id]),
      db.execute(`SELECT o.id, o.order_number, o.total_amount, o.status, o.created_at,
                         u.name AS customer_name
                  FROM orders o LEFT JOIN users u ON u.id = o.customer_user_id
                  WHERE o.vendor_id = ? ORDER BY o.created_at DESC LIMIT 5`, [vendor.id]),
    ]);

    return success(res, {
      total_orders:  totalOrders.total,
      total_revenue: revenue.total,
      pending_orders: pendingOrders.total,
      recent_orders: recentOrders,
    });
  } catch (err) { next(err); }
};
