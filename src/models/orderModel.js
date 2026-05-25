const db = require('../config/db');

const create = async (conn, { customer_user_id, vendor_id, order_number, shipping_address_id,
                               billing_address_id, billing_same_as_shipping, shipping_service_id,
                               shipping_cost, subtotal, total_amount, seller_type, seller_id,
                               gst_percent, gst_amount, payable_amount, notes }) => {
  const [result] = await conn.execute(
    `INSERT INTO orders
       (customer_user_id, vendor_id, seller_type, seller_id, order_number, shipping_address_id, billing_address_id,
        billing_same_as_shipping, shipping_service_id, shipping_cost, subtotal, total_amount,
        gst_percent, gst_amount, payable_amount, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [customer_user_id, vendor_id || null, seller_type || 'admin', seller_id || null, order_number,
     shipping_address_id, billing_address_id || null, billing_same_as_shipping ?? 1,
     shipping_service_id || null, shipping_cost || 0, subtotal || 0, total_amount || 0,
     gst_percent || 0, gst_amount || 0, payable_amount || total_amount || 0, notes || null]
  );
  return result.insertId;
};

const createItem = (conn, item) => {
  const {
    order_id, listed_product_id, listed_product_size,
    product_type_id, material_id, material_style_id, frame_id, wallpaper_id,
    add_border_id, border_is_lit,
    lollipop_element_id,
    pylon_id, pylon_category_id, pylon_tiles_count, pylon_tiles_images,
    pylon_category_price, pylon_tiles_price, pylon_category_cost, pylon_tiles_cost,
    base_id, thickness_id, element_id, color_id, font_id,
    illumination_option_id, text_layers, height, width, dimension_unit_id,
    uploaded_image_url, price_per_sqft, material_cost, material_style_price_per_sqft, material_style_cost,
    frame_price_per_sqft, frame_cost,
    wallpaper_price_per_sqft, wallpaper_cost,
    add_border_base_price, add_border_lit_extra, add_border_cost,
    lollipop_element_cost,
    base_price_per_sqft, base_cost,
    thickness_price_per_sqft, thickness_cost,
    element_cost, color_extra, illumination_cost, unit_price, quantity, total_price, preview_image_url,
  } = item;

  const columns = [
    'order_id', 'listed_product_id', 'listed_product_size', 'product_type_id', 'material_id', 'material_style_id',
    'frame_id', 'wallpaper_id', 'add_border_id', 'border_is_lit', 'lollipop_element_id',
    'pylon_id', 'pylon_category_id', 'pylon_tiles_count', 'pylon_tiles_images',
    'pylon_category_price', 'pylon_tiles_price', 'pylon_category_cost', 'pylon_tiles_cost',
    'base_id', 'thickness_id', 'element_id', 'color_id', 'font_id', 'illumination_option_id', 'text_layers',
    'height', 'width', 'dimension_unit_id', 'uploaded_image_url',
    'price_per_sqft', 'material_cost', 'material_style_price_per_sqft', 'material_style_cost',
    'frame_price_per_sqft', 'frame_cost', 'wallpaper_price_per_sqft', 'wallpaper_cost',
    'add_border_base_price', 'add_border_lit_extra', 'add_border_cost', 'lollipop_element_cost',
    'base_price_per_sqft', 'base_cost', 'thickness_price_per_sqft', 'thickness_cost',
    'element_cost', 'color_extra', 'illumination_cost', 'unit_price', 'quantity', 'total_price', 'preview_image_url',
  ];

  const values = [
    order_id, listed_product_id || null, listed_product_size || null,
    product_type_id, material_id || null, material_style_id || null, frame_id || null, wallpaper_id || null,
    add_border_id || null, border_is_lit ? 1 : 0, lollipop_element_id || null,
    pylon_id || null, pylon_category_id || null, pylon_tiles_count ?? 0,
    pylon_tiles_images?.length ? JSON.stringify(pylon_tiles_images) : null,
    pylon_category_price ?? 0, pylon_tiles_price ?? 0, pylon_category_cost ?? 0, pylon_tiles_cost ?? 0,
    base_id || null, thickness_id || null, element_id || null, color_id || null, font_id || null,
    illumination_option_id || null,
    text_layers ? JSON.stringify(text_layers) : null,
    height ?? 0, width ?? 0, dimension_unit_id || null, uploaded_image_url || null,
    price_per_sqft, material_cost, material_style_price_per_sqft ?? 0, material_style_cost ?? 0,
    frame_price_per_sqft ?? 0, frame_cost ?? 0,
    wallpaper_price_per_sqft ?? 0, wallpaper_cost ?? 0,
    add_border_base_price ?? 0, add_border_lit_extra ?? 0, add_border_cost ?? 0,
    lollipop_element_cost ?? 0,
    base_price_per_sqft ?? 0, base_cost ?? 0,
    thickness_price_per_sqft ?? 0, thickness_cost ?? 0,
    element_cost, color_extra, illumination_cost ?? 0,
    unit_price, quantity, total_price, preview_image_url || null,
  ];

  const placeholders = columns.map(() => '?').join(', ');
  return conn.execute(
    `INSERT INTO order_items (${columns.join(', ')}) VALUES (${placeholders})`,
    values
  );
};

const getByCustomer = ({ userId, status, offset, limit }) => {
  const conds = ['o.customer_user_id = ?']; const vals = [userId];
  if (status) { conds.push('o.status = ?'); vals.push(status); }
  const sql = `
    SELECT o.*, inv.invoice_number,
           u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
           v.business_name AS vendor_name, ss.name AS shipping_service_name
    FROM orders o
    LEFT JOIN order_invoice_numbers inv ON inv.order_id = o.id
    LEFT JOIN users u              ON u.id = o.customer_user_id
    LEFT JOIN vendors v          ON v.id  = o.vendor_id
    LEFT JOIN shipping_services ss ON ss.id = o.shipping_service_id
    WHERE ${conds.join(' AND ')}
    ORDER BY o.created_at DESC LIMIT ? OFFSET ?
  `;
  return db.paginate(sql, `SELECT COUNT(*) AS total FROM orders o WHERE ${conds.join(' AND ')}`,
    [...vals, limit, offset], vals);
};

const getById = (id) =>
  db.findOne(
    `SELECT o.*, inv.invoice_number, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
            v.business_name AS vendor_name, ss.name AS shipping_service_name
     FROM orders o
     LEFT JOIN order_invoice_numbers inv ON inv.order_id = o.id
     LEFT JOIN users u              ON u.id  = o.customer_user_id
     LEFT JOIN vendors v            ON v.id  = o.vendor_id
     LEFT JOIN shipping_services ss ON ss.id  = o.shipping_service_id
     WHERE o.id = ?`, [id]
  );

const ORDER_ITEMS_SELECT = `
  SELECT oi.*,
         pt.name AS product_type_name, pt.slug AS product_type_slug,
         m.name AS material_name, m.description AS material_description, m.file_url AS material_file_url,
         ms.name AS material_style_name, ms.description AS material_style_description,
         fr.name AS frame_name, fr.description AS frame_description, fr.file_url AS frame_file_url,
         wp.name AS wallpaper_name, wp.wallpaper_type AS wallpaper_type,
         wp.description AS wallpaper_description, wp.file_url AS wallpaper_file_url,
         ab.shape AS add_border_shape, ab.size AS add_border_size,
         ab.height AS add_border_height, ab.width AS add_border_width, ab.file_url AS add_border_file_url,
         le.name AS lollipop_element_name, le.description AS lollipop_element_description,
         le.thumbnail_url AS lollipop_element_thumbnail_url, le.file_url AS lollipop_element_file_url,
         py.name AS pylon_name, py.description AS pylon_description,
         py.thumbnail_url AS pylon_thumbnail_url, py.file_url AS pylon_file_url,
         pc.name AS pylon_category_name, pc.tiles_name AS pylon_tiles_name,
         b.name AS base_name, b.description AS base_description, b.file_url AS base_file_url,
         th.name AS thickness_name, th.description AS thickness_description, th.file_url AS thickness_file_url,
         e.name AS element_name, e.description AS element_description, e.file_url AS element_file_url,
         c.hex_code, c.name AS color_name,
         f.name AS font_name, f.file_url AS font_file_url,
         io.name AS illumination_option_name, io.category AS illumination_category,
         io.description AS illumination_description,
         du.unit_name, du.conversion_to_sqft,
         lp.name AS listed_product_name, lp.description AS listed_product_description,
         lp.thumbnail_url AS listed_product_thumbnail,
         lpv.height AS listed_product_height,
         lpv.width AS listed_product_width
  FROM order_items oi
  LEFT JOIN product_types pt ON pt.id = oi.product_type_id
  LEFT JOIN listed_products lp ON lp.id = oi.listed_product_id
  LEFT JOIN listed_product_variants lpv ON lpv.listed_product_id = oi.listed_product_id AND lpv.size = oi.listed_product_size
  LEFT JOIN materials m ON m.id = oi.material_id
  LEFT JOIN material_styles ms ON ms.id = oi.material_style_id
  LEFT JOIN frames fr ON fr.id = oi.frame_id
  LEFT JOIN wallpapers wp ON wp.id = oi.wallpaper_id
  LEFT JOIN add_borders ab ON ab.id = oi.add_border_id
  LEFT JOIN lollipop_elements le ON le.id = oi.lollipop_element_id
  LEFT JOIN pylons py ON py.id = oi.pylon_id
  LEFT JOIN pylon_categories pc ON pc.id = oi.pylon_category_id
  LEFT JOIN bases b ON b.id = oi.base_id
  LEFT JOIN thicknesses th ON th.id = oi.thickness_id
  LEFT JOIN elements e ON e.id = oi.element_id
  LEFT JOIN colors c ON c.id = oi.color_id
  LEFT JOIN fonts f ON f.id = oi.font_id
  LEFT JOIN illumination_options io ON io.id = oi.illumination_option_id
  LEFT JOIN dimension_units du ON du.id = oi.dimension_unit_id`;

const getOrderItems = (orderId) =>
  db.execute(`${ORDER_ITEMS_SELECT} WHERE oi.order_id = ? ORDER BY oi.id ASC`, [orderId]);

const getOrderItemsEnriched = (orderId) => getOrderItems(orderId);

const getOrderItemsEnrichedByOrderIds = (orderIds) => {
  if (!orderIds?.length) return Promise.resolve([]);
  const placeholders = orderIds.map(() => '?').join(',');
  return db.execute(
    `${ORDER_ITEMS_SELECT} WHERE oi.order_id IN (${placeholders}) ORDER BY oi.order_id ASC, oi.id ASC`,
    orderIds
  );
};

const updateStatus = (id, status) =>
  db.execute('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);

const updatePayment = (id, { payment_method, payment_status, payment_transaction_id }) =>
  db.execute(
    'UPDATE orders SET payment_method = ?, payment_status = ?, payment_transaction_id = ?, updated_at = NOW() WHERE id = ?',
    [payment_method, payment_status, payment_transaction_id, id]
  );

const updateOrderNumber = (id, orderNumber) =>
  db.execute(
    'UPDATE orders SET order_number = ?, updated_at = NOW() WHERE id = ?',
    [orderNumber, id]
  );

const updatePaymentBatchId = (conn, orderId, paymentBatchId) =>
  conn.execute('UPDATE orders SET payment_batch_id = ?, updated_at = NOW() WHERE id = ?', [paymentBatchId, orderId]);

const getAll = ({ status, vendorId, offset, limit }) => {
  const conds = []; const vals = [];
  if (status)   { conds.push('o.status = ?');    vals.push(status); }
  if (vendorId) { conds.push('o.vendor_id = ?'); vals.push(vendorId); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const sql = `
    SELECT o.*, inv.invoice_number,
           u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
           v.business_name AS vendor_name, ss.name AS shipping_service_name
    FROM orders o
    LEFT JOIN order_invoice_numbers inv ON inv.order_id = o.id
    LEFT JOIN users u ON u.id = o.customer_user_id
    LEFT JOIN vendors v ON v.id = o.vendor_id
    LEFT JOIN shipping_services ss ON ss.id = o.shipping_service_id
    ${where}
    ORDER BY o.created_at DESC LIMIT ? OFFSET ?
  `;
  return db.paginate(sql, `SELECT COUNT(*) AS total FROM orders o ${where}`,
    [...vals, limit, offset], vals);
};

const getByVendor = ({ vendorId, status, offset, limit }) => {
  const conds = ['o.vendor_id = ?']; const vals = [vendorId];
  if (status) { conds.push('o.status = ?'); vals.push(status); }
  const sql = `
    SELECT o.*, inv.invoice_number,
           u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
           v.business_name AS vendor_name, ss.name AS shipping_service_name
    FROM orders o
    LEFT JOIN users u ON u.id = o.customer_user_id
    LEFT JOIN order_invoice_numbers inv ON inv.order_id = o.id
    LEFT JOIN vendors v ON v.id = o.vendor_id
    LEFT JOIN shipping_services ss ON ss.id = o.shipping_service_id
    WHERE ${conds.join(' AND ')}
    ORDER BY o.created_at DESC LIMIT ? OFFSET ?
  `;
  return db.paginate(sql, `SELECT COUNT(*) AS total FROM orders o WHERE ${conds.join(' AND ')}`,
    [...vals, limit, offset], vals);
};

module.exports = {
  create, createItem, getByCustomer, getById, getOrderItems, getOrderItemsEnriched, getOrderItemsEnrichedByOrderIds,
  updateStatus, updatePayment, updateOrderNumber, updatePaymentBatchId,
  getAll, getByVendor,
};
