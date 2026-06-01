const db = require('../config/db');

/** Match listed_product_variants.size collation when joining/comparing */
const SIZE_CMP = (colA, colB) => `${colA} COLLATE utf8mb4_unicode_ci = ${colB} COLLATE utf8mb4_unicode_ci`;

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

const parseUrlArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((u) => typeof u === 'string' && u.trim()).map((u) => u.trim());
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((u) => typeof u === 'string' && u.trim()).map((u) => u.trim())
        : [];
    } catch (_) {
      return value.trim() ? [value.trim()] : [];
    }
  }
  return [];
};

const normalizeCartRow = (row) => {
  if (!row) return row;
  return {
    ...row,
    text_layers: parseTextLayers(row.text_layers),
    text_dimension: parseTextLayers(row.text_dimension),
    logo_dimension: parseTextLayers(row.logo_dimension),
    pylon_tiles_images: parseUrlArray(row.pylon_tiles_images),
  };
};

const getCartByUser = (userId, { customOnly = false, listedOnly = false } = {}) => {
  const conds = ['ci.user_id = ?'];
  const vals = [userId];
  if (customOnly) conds.push('ci.listed_product_id IS NULL');
  if (listedOnly) conds.push('ci.listed_product_id IS NOT NULL');
  return db.execute(
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
            ab.shape AS add_border_shape, ab.size AS add_border_size,
            ab.height AS add_border_height, ab.width AS add_border_width,
            ab.admin_price AS add_border_admin_price, ab.lit_price AS add_border_lit_price,
            ab.file_url AS add_border_file_url,
            le.name AS lollipop_element_name,
            le.admin_price AS lollipop_element_admin_price,
            le.description AS lollipop_element_description,
            le.thumbnail_url AS lollipop_element_thumbnail_url,
            le.file_url AS lollipop_element_file_url,
            py.name AS pylon_name, py.description AS pylon_description,
            py.thumbnail_url AS pylon_thumbnail_url, py.file_url AS pylon_file_url,
            pc.name AS pylon_category_name,
            pc.admin_category_price AS pylon_category_admin_price,
            pc.tiles_name AS pylon_tiles_name,
            pc.admin_tiles_price AS pylon_tiles_admin_price,
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
            v.business_name AS vendor_name,
            lp.name AS listed_product_name, lp.description AS listed_product_description,
            lp.thumbnail_url AS listed_product_thumbnail,
            lpv.admin_price AS listed_variant_admin_price,
            lpv.height AS listed_variant_height,
            lpv.width AS listed_variant_width
     FROM cart_items ci
     LEFT JOIN product_types  pt ON pt.id = ci.product_type_id
     LEFT JOIN listed_products lp ON lp.id = ci.listed_product_id
     LEFT JOIN listed_product_variants lpv ON lpv.listed_product_id = ci.listed_product_id
       AND ${SIZE_CMP('lpv.size', 'ci.listed_product_size')}
       AND lpv.is_active = 1
     LEFT JOIN materials        m ON m.id  = ci.material_id
     LEFT JOIN material_styles ms ON ms.id = ci.material_style_id
     LEFT JOIN frames          fr ON fr.id = ci.frame_id
     LEFT JOIN wallpapers      wp ON wp.id = ci.wallpaper_id
     LEFT JOIN add_borders     ab ON ab.id = ci.add_border_id
     LEFT JOIN lollipop_elements le ON le.id = ci.lollipop_element_id
     LEFT JOIN pylons py ON py.id = ci.pylon_id
     LEFT JOIN pylon_categories pc ON pc.id = ci.pylon_category_id
     LEFT JOIN bases              b ON b.id  = ci.base_id
     LEFT JOIN thicknesses       th ON th.id = ci.thickness_id
     LEFT JOIN elements         e ON e.id  = ci.element_id
     LEFT JOIN colors           c ON c.id  = ci.color_id
     LEFT JOIN fonts            f ON f.id  = ci.font_id
     LEFT JOIN illumination_options io ON io.id = ci.illumination_option_id
     LEFT JOIN dimension_units du ON du.id = ci.dimension_unit_id
     LEFT JOIN vendors          v ON v.id  = ci.vendor_id
     WHERE ${conds.join(' AND ')}
     ORDER BY ci.created_at DESC`,
    vals
  ).then((rows) => rows.map(normalizeCartRow));
};

const getItemById = (id, userId) =>
  db.findOne('SELECT * FROM cart_items WHERE id = ? AND user_id = ?', [id, userId]).then(normalizeCartRow);

const addItem = ({ user_id, product_type_id, material_id, material_style_id, frame_id, wallpaper_id,
                   add_border_id, border_is_lit, lollipop_element_id,
                   pylon_id, pylon_category_id, pylon_tiles_count, pylon_tiles_images,
                   base_id, thickness_id, element_id, color_id, font_id,
                   illumination_option_id, text_layers, text_dimension, logo_dimension,
                   height, width, dimension_unit_id,
                   uploaded_image_url, preview_image_url, quantity }) =>
  db.execute(
    `INSERT INTO cart_items
       (user_id, product_type_id, material_id, material_style_id, frame_id, wallpaper_id,
        add_border_id, border_is_lit, lollipop_element_id,
        pylon_id, pylon_category_id, pylon_tiles_count, pylon_tiles_images,
        base_id, thickness_id, element_id, color_id, font_id,
        illumination_option_id, text_layers, text_dimension, logo_dimension, height, width, dimension_unit_id,
        uploaded_image_url, preview_image_url, quantity)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user_id, product_type_id, material_id || null, material_style_id || null, frame_id || null, wallpaper_id || null,
     add_border_id || null, border_is_lit ? 1 : 0, lollipop_element_id || null,
     pylon_id || null, pylon_category_id || null, Math.max(0, parseInt(pylon_tiles_count, 10) || 0),
     pylon_tiles_images?.length ? JSON.stringify(pylon_tiles_images) : null,
     base_id || null, thickness_id || null, element_id || null,
     color_id || null, font_id || null, illumination_option_id || null,
     text_layers ? JSON.stringify(text_layers) : null,
     text_dimension?.length ? JSON.stringify(text_dimension) : null,
     logo_dimension?.length ? JSON.stringify(logo_dimension) : null,
     height || 0, width || 0, dimension_unit_id || null,
     uploaded_image_url || null, preview_image_url || null, quantity || 1]
  );

const updateItem = (id, fields) => {
  const allowed = ['material_id','material_style_id','frame_id','wallpaper_id','add_border_id','border_is_lit','lollipop_element_id',
                   'pylon_id','pylon_category_id','pylon_tiles_count','pylon_tiles_images',
                   'base_id','thickness_id','element_id','color_id','font_id','illumination_option_id',
                   'text_layers','text_dimension','logo_dimension','height','width','dimension_unit_id','quantity',
                   'uploaded_image_url','preview_image_url','vendor_id'];
  const sets = []; const values = [];
  allowed.forEach((k) => {
    if (fields[k] !== undefined) {
      sets.push(`${k} = ?`);
      let v = fields[k];
      if (k === 'text_layers' && v) v = JSON.stringify(v);
      if ((k === 'text_dimension' || k === 'logo_dimension')) v = v?.length ? JSON.stringify(v) : null;
      if (k === 'pylon_tiles_images') v = v?.length ? JSON.stringify(v) : null;
      if (k === 'border_is_lit') v = v ? 1 : 0;
      values.push(v);
    }
  });
  if (!sets.length) return Promise.resolve(null);
  values.push(id);
  return db.execute(`UPDATE cart_items SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
};

const findListedLine = (userId, listedProductId, size, colorId = null) =>
  db.findOne(
    `SELECT * FROM cart_items
     WHERE user_id = ? AND listed_product_id = ?
       AND listed_product_size COLLATE utf8mb4_unicode_ci = ?
       AND color_id <=> ?`,
    [userId, listedProductId, size, colorId ?? null]
  ).then(normalizeCartRow);

const addListedItem = async ({ user_id, listed_product_id, listed_product_size, product_type_id, quantity, color_id }) => {
  const qty = Math.min(100, Math.max(1, parseInt(quantity, 10) || 1));
  const colorId = color_id || null;
  const existing = await findListedLine(user_id, listed_product_id, listed_product_size, colorId);
  if (existing) {
    // Set absolute qty (picker value), not increment — avoids double-submit / duplicate POST → qty 2
    await db.execute(
      'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?',
      [qty, existing.id]
    );
    return { insertId: existing.id, merged: true };
  }
  const result = await db.execute(
    `INSERT INTO cart_items (user_id, listed_product_id, listed_product_size, product_type_id, color_id, quantity, vendor_id)
     VALUES (?, ?, ?, ?, ?, ?, NULL)`,
    [user_id, listed_product_id, listed_product_size, product_type_id, colorId, qty]
  );
  return { insertId: result.insertId, merged: false };
};

const removeItem  = (id, userId) => db.execute('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [id, userId]);
const clearCart   = (userId)     => db.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);
const selectVendor= (id, userId, vendorId) =>
  db.execute('UPDATE cart_items SET vendor_id = ?, updated_at = NOW() WHERE id = ? AND user_id = ?', [vendorId, id, userId]);

module.exports = {
  getCartByUser, getItemById, addItem, addListedItem, findListedLine,
  updateItem, removeItem, clearCart, selectVendor,
};
