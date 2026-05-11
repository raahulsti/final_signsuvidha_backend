-- Thickness options (per product type), priced per sq ft — same pattern as bases.
-- Run after product_types exists.

CREATE TABLE IF NOT EXISTS thicknesses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_type_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(1000) NULL,
  thumbnail_url VARCHAR(500) NULL,
  file_url VARCHAR(500) NULL,
  admin_price_per_sqft DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_thicknesses_product_type (product_type_id),
  KEY idx_thicknesses_active (is_active)
);

CREATE TABLE IF NOT EXISTS vendor_thickness_pricing (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  thickness_id BIGINT UNSIGNED NOT NULL,
  price_per_sqft DECIMAL(12,2) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vendor_thickness (vendor_id, thickness_id)
);

-- MySQL: no IF NOT EXISTS on ADD COLUMN. Run once; skip line if Error 1060 duplicate column.
-- Requires cart_items.base_id (and order_items base columns) from add_bases_module.sql first.

ALTER TABLE cart_items
  ADD COLUMN thickness_id BIGINT UNSIGNED NULL AFTER base_id;

ALTER TABLE order_items
  ADD COLUMN thickness_id BIGINT UNSIGNED NULL AFTER base_id;

ALTER TABLE order_items
  ADD COLUMN thickness_price_per_sqft DECIMAL(12,4) NULL AFTER base_cost;

ALTER TABLE order_items
  ADD COLUMN thickness_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER thickness_price_per_sqft;
