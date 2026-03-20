const db      = require('../../config/db');
const { success } = require('../../utils/response');

exports.getStats = async (req, res, next) => {
  try {
    const [
      totalOrders, totalRevenue, totalVendors,
      totalCustomers, pendingVendors, recentOrders,
    ] = await Promise.all([
      db.findOne('SELECT COUNT(*) AS total FROM orders'),
      db.findOne('SELECT COALESCE(SUM(total_amount),0) AS total FROM orders WHERE payment_status = "paid"'),
      db.findOne('SELECT COUNT(*) AS total FROM vendors WHERE is_approved = 1'),
      db.findOne(`SELECT COUNT(*) AS total FROM user_roles ur
                  INNER JOIN roles r ON r.id = ur.role_id WHERE r.name = 'customer'`),
      db.findOne('SELECT COUNT(*) AS total FROM vendors WHERE is_approved = 0'),
      db.execute(`SELECT o.id, o.order_number, o.total_amount, o.status, o.created_at,
                         u.name AS customer_name
                  FROM orders o LEFT JOIN users u ON u.id = o.customer_user_id
                  ORDER BY o.created_at DESC LIMIT 5`),
    ]);

    return success(res, {
      total_orders:    totalOrders.total,
      total_revenue:   totalRevenue.total,
      total_vendors:   totalVendors.total,
      total_customers: totalCustomers.total,
      pending_vendors: pendingVendors.total,
      recent_orders:   recentOrders,
    });
  } catch (err) { next(err); }
};
