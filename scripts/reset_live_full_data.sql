-- =============================================================================
-- FULL FACTORY RESET — transactional + masters + users (except super_admin)
-- =============================================================================
-- WARNING: IRREVERSIBLE. Take a DB backup before running on live.
--
-- KEEPS:
--   - roles (customer, vendor, super_admin)
--   - super_admin user + user_roles row
--
-- CLIENT WILL RE-ADD via Admin Panel:
--   product_types, materials, colors, fonts, listed products, vendors, CMS, etc.
--
-- S3: DB reset does NOT delete uploaded images. Empty the S3 bucket separately
--     (customer-profiles/, product images, fonts, etc.) if you want a clean slate.
--
-- NOTE: Code has LOLLIPOP_PRODUCT_TYPE_ID = 6 in constants.js. After reset,
--       create lollipop_sign product type early OR update that constant to match
--       the new id. Product type slugs must match constants (3d_signage, wallpaper, …).
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. Orders & payments ─────────────────────────────────────────────────────
TRUNCATE TABLE order_payment_batch_items;
TRUNCATE TABLE order_items;
TRUNCATE TABLE order_invoice_numbers;
TRUNCATE TABLE orders;
TRUNCATE TABLE order_payment_batches;
TRUNCATE TABLE order_serial_counters;

-- ── 2. Cart & addresses ──────────────────────────────────────────────────────
TRUNCATE TABLE cart_items;
TRUNCATE TABLE customer_addresses;

-- ── 3. Auth sessions & OTP ───────────────────────────────────────────────────
TRUNCATE TABLE auth_tokens;
TRUNCATE TABLE otp_verifications;

-- ── 4. Vendor pricing (all modules) ─────────────────────────────────────────
TRUNCATE TABLE vendor_material_pricing;
TRUNCATE TABLE vendor_base_pricing;
TRUNCATE TABLE vendor_thickness_pricing;
TRUNCATE TABLE vendor_material_style_pricing;
TRUNCATE TABLE vendor_frame_pricing;
TRUNCATE TABLE vendor_wallpaper_pricing;
TRUNCATE TABLE vendor_element_pricing;
TRUNCATE TABLE vendor_color_pricing;
TRUNCATE TABLE vendor_font_pricing;
TRUNCATE TABLE vendor_illumination_pricing;
TRUNCATE TABLE vendor_add_border_pricing;
TRUNCATE TABLE vendor_lollipop_element_pricing;
TRUNCATE TABLE vendor_pylon_category_pricing;

-- ── 5. Vendors (before wiping non-admin users) ───────────────────────────────
TRUNCATE TABLE vendors;

-- ── 6. Listed products ───────────────────────────────────────────────────────
TRUNCATE TABLE listed_product_images;
TRUNCATE TABLE listed_product_variants;
TRUNCATE TABLE listed_products;

-- ── 7. Pylon / border / lollipop ─────────────────────────────────────────────
TRUNCATE TABLE pylon_categories;
TRUNCATE TABLE pylons;
TRUNCATE TABLE add_borders;
TRUNCATE TABLE lollipop_elements;

-- ── 8. Product-type junction & font pricing ──────────────────────────────────
TRUNCATE TABLE product_type_shadow_colors;
TRUNCATE TABLE product_type_border_colors;
TRUNCATE TABLE product_type_base_colors;
TRUNCATE TABLE product_type_colors;
TRUNCATE TABLE product_type_fonts;
TRUNCATE TABLE font_product_type_pricing;

-- ── 9. Catalog masters ───────────────────────────────────────────────────────
TRUNCATE TABLE illumination_options;
TRUNCATE TABLE image_assets;
TRUNCATE TABLE elements;
TRUNCATE TABLE element_types;
TRUNCATE TABLE fonts;
TRUNCATE TABLE letter_styles;
TRUNCATE TABLE colors;
TRUNCATE TABLE shadow_colors;
TRUNCATE TABLE border_colors;
TRUNCATE TABLE base_colors;
TRUNCATE TABLE wallpapers;
TRUNCATE TABLE frames;
TRUNCATE TABLE material_styles;
TRUNCATE TABLE thicknesses;
TRUNCATE TABLE bases;
TRUNCATE TABLE materials;
TRUNCATE TABLE product_types;
TRUNCATE TABLE font_sizes;
TRUNCATE TABLE dimension_units;
TRUNCATE TABLE shipping_services;
TRUNCATE TABLE cms_pages;

-- ── 10. Tax (re-seed default GST) ────────────────────────────────────────────
TRUNCATE TABLE tax_config;
INSERT INTO tax_config (gst_percent, is_active) VALUES (18.00, 1);

-- ── 11. Users — keep super_admin only ────────────────────────────────────────
DELETE FROM user_roles
WHERE user_id NOT IN (
  SELECT id FROM (
    SELECT u.id
    FROM users u
    INNER JOIN user_roles ur ON ur.user_id = u.id
    INNER JOIN roles r ON r.id = ur.role_id
    WHERE r.name = 'super_admin'
  ) AS keep_users
);

DELETE FROM users
WHERE id NOT IN (
  SELECT id FROM (
    SELECT u.id
    FROM users u
    INNER JOIN user_roles ur ON ur.user_id = u.id
    INNER JOIN roles r ON r.id = ur.role_id
    WHERE r.name = 'super_admin'
  ) AS keep_users
);

SET FOREIGN_KEY_CHECKS = 1;

-- Verify:
-- SELECT COUNT(*) FROM users;
-- SELECT COUNT(*) FROM product_types;
-- SELECT COUNT(*) FROM orders;
-- SELECT * FROM order_serial_counters;
