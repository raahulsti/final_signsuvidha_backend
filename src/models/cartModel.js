const db = require('../config/db');

const getCartByUser = (userId) =>
  db.execute(
    `SELECT ci.*,
            pt.name   AS product_type_name, pt.slug AS product_type_slug,
            m.name    AS material_name,     m.admin_price_per_sqft,
            e.name    AS element_name,      e.admin_price_extra,
            c.hex_code, c.name AS color_name,
            f.name    AS font_name,
            ls.name   AS letter_style_name, ls.price_multiplier,
            du.unit_name,                   du.conversion_to_sqft,
            v.business_name AS vendor_name
     FROM cart_items ci
     LEFT JOIN product_types  pt ON pt.id = ci.product_type_id
     LEFT JOIN materials        m ON m.id  = ci.material_id
     LEFT JOIN elements         e ON e.id  = ci.element_id
     LEFT JOIN colors           c ON c.id  = ci.color_id
     LEFT JOIN fonts            f ON f.id  = ci.font_id
     LEFT JOIN letter_styles   ls ON ls.id = ci.letter_style_id
     LEFT JOIN dimension_units du ON du.id = ci.dimension_unit_id
     LEFT JOIN vendors          v ON v.id  = ci.vendor_id
     WHERE ci.user_id = ?
     ORDER BY ci.created_at DESC`,
    [userId]
  );

const getItemById = (id, userId) =>
  db.findOne('SELECT * FROM cart_items WHERE id = ? AND user_id = ?', [id, userId]);

const addItem = ({ user_id, product_type_id, material_id, element_id, color_id, font_id,
                   letter_style_id, text_layers, height, width, dimension_unit_id,
                   uploaded_image_url, preview_image_url, quantity }) =>
  db.execute(
    `INSERT INTO cart_items
       (user_id, product_type_id, material_id, element_id, color_id, font_id,
        letter_style_id, text_layers, height, width, dimension_unit_id,
        uploaded_image_url, preview_image_url, quantity)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user_id, product_type_id, material_id || null, element_id || null,
     color_id || null, font_id || null, letter_style_id || null,
     text_layers ? JSON.stringify(text_layers) : null,
     height || 0, width || 0, dimension_unit_id || null,
     uploaded_image_url || null, preview_image_url || null, quantity || 1]
  );

const updateItem = (id, fields) => {
  const allowed = ['material_id','element_id','color_id','font_id','letter_style_id',
                   'text_layers','height','width','dimension_unit_id','quantity',
                   'uploaded_image_url','preview_image_url','vendor_id'];
  const sets = []; const values = [];
  allowed.forEach((k) => {
    if (fields[k] !== undefined) {
      sets.push(`${k} = ?`);
      values.push(k === 'text_layers' && fields[k] ? JSON.stringify(fields[k]) : fields[k]);
    }
  });
  if (!sets.length) return Promise.resolve(null);
  values.push(id);
  return db.execute(`UPDATE cart_items SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
};

const removeItem  = (id, userId) => db.execute('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [id, userId]);
const clearCart   = (userId)     => db.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);
const selectVendor= (id, userId, vendorId) =>
  db.execute('UPDATE cart_items SET vendor_id = ?, updated_at = NOW() WHERE id = ? AND user_id = ?', [vendorId, id, userId]);

module.exports = { getCartByUser, getItemById, addItem, updateItem, removeItem, clearCart, selectVendor };
