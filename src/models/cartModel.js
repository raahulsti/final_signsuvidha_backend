const db = require('../config/db');

const parseTextLayers = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }
  return [];
};

const normalizeCartRow = (row) => {
  if (!row) return row;
  return {
    ...row,
    text_layers: parseTextLayers(row.text_layers),
  };
};

const getCartByUser = (userId) =>
  db.execute(
    `SELECT ci.*,
            pt.name   AS product_type_name, pt.slug AS product_type_slug,
            m.name    AS material_name,     m.admin_price_per_sqft, m.description AS material_description,
            m.file_url AS material_file_url,
            ms.name   AS material_style_name, ms.admin_price_per_sqft AS material_style_admin_price_per_sqft,
            ms.description AS material_style_description,
            fr.name   AS frame_name,         fr.admin_price_per_sqft AS frame_admin_price_per_sqft,
            fr.description AS frame_description, fr.file_url AS frame_file_url,
            wp.name   AS wallpaper_name,     wp.admin_price_per_sqft AS wallpaper_admin_price_per_sqft,
            wp.wallpaper_type AS wallpaper_type,
            wp.description AS wallpaper_description, wp.file_url AS wallpaper_file_url,
            b.name    AS base_name,         b.admin_price_per_sqft AS base_admin_price_per_sqft, b.description AS base_description,
            b.file_url AS base_file_url,
            th.name   AS thickness_name,    th.admin_price_per_sqft AS thickness_admin_price_per_sqft, th.description AS thickness_description,
            th.file_url AS thickness_file_url,
            e.name    AS element_name,      e.admin_price_extra, e.description AS element_description,
            e.file_url AS element_file_url,
            c.hex_code, c.name AS color_name,
            f.name    AS font_name,         f.file_url AS font_file_url,
            io.name   AS illumination_option_name, io.category AS illumination_category,
            io.admin_price_per_sqft AS illumination_admin_price_per_sqft,
            io.description AS illumination_description,
            du.unit_name,                   du.conversion_to_sqft,
            v.business_name AS vendor_name
     FROM cart_items ci
     LEFT JOIN product_types  pt ON pt.id = ci.product_type_id
     LEFT JOIN materials        m ON m.id  = ci.material_id
     LEFT JOIN material_styles ms ON ms.id = ci.material_style_id
     LEFT JOIN frames          fr ON fr.id = ci.frame_id
     LEFT JOIN wallpapers      wp ON wp.id = ci.wallpaper_id
     LEFT JOIN bases              b ON b.id  = ci.base_id
     LEFT JOIN thicknesses       th ON th.id = ci.thickness_id
     LEFT JOIN elements         e ON e.id  = ci.element_id
     LEFT JOIN colors           c ON c.id  = ci.color_id
     LEFT JOIN fonts            f ON f.id  = ci.font_id
     LEFT JOIN illumination_options io ON io.id = ci.illumination_option_id
     LEFT JOIN dimension_units du ON du.id = ci.dimension_unit_id
     LEFT JOIN vendors          v ON v.id  = ci.vendor_id
     WHERE ci.user_id = ?
     ORDER BY ci.created_at DESC`,
    [userId]
  ).then((rows) => rows.map(normalizeCartRow));

const getItemById = (id, userId) =>
  db.findOne('SELECT * FROM cart_items WHERE id = ? AND user_id = ?', [id, userId]).then(normalizeCartRow);

const addItem = ({ user_id, product_type_id, material_id, material_style_id, frame_id, wallpaper_id, base_id, thickness_id, element_id, color_id, font_id,
                   illumination_option_id, text_layers, height, width, dimension_unit_id,
                   uploaded_image_url, preview_image_url, quantity }) =>
  db.execute(
    `INSERT INTO cart_items
       (user_id, product_type_id, material_id, material_style_id, frame_id, wallpaper_id, base_id, thickness_id, element_id, color_id, font_id,
        illumination_option_id, text_layers, height, width, dimension_unit_id,
        uploaded_image_url, preview_image_url, quantity)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user_id, product_type_id, material_id || null, material_style_id || null, frame_id || null, wallpaper_id || null, base_id || null, thickness_id || null, element_id || null,
     color_id || null, font_id || null, illumination_option_id || null,
     text_layers ? JSON.stringify(text_layers) : null,
     height || 0, width || 0, dimension_unit_id || null,
     uploaded_image_url || null, preview_image_url || null, quantity || 1]
  );

const updateItem = (id, fields) => {
  const allowed = ['material_id','material_style_id','frame_id','wallpaper_id','base_id','thickness_id','element_id','color_id','font_id','illumination_option_id',
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
