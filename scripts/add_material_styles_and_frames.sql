-- Material styles: per product type, priced per sq ft — text only (no image columns).
-- Frames: same pattern as materials (name, description, thumbnail, file, admin price per sq ft).
-- Run on DB after product_types exists. Re-run safe: skip ALTER lines that error with duplicate column.

CREATE TABLE IF NOT EXISTS material_styles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_type_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(1000) NULL,
  admin_price_per_sqft DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_material_styles_product (product_type_id),
  KEY idx_material_styles_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS frames (
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
  KEY idx_frames_product (product_type_id),
  KEY idx_frames_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vendor_material_style_pricing (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  material_style_id BIGINT UNSIGNED NOT NULL,
  price_per_sqft DECIMAL(12,2) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vendor_material_style (vendor_id, material_style_id),
  KEY idx_vmsp_style (material_style_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vendor_frame_pricing (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  frame_id BIGINT UNSIGNED NOT NULL,
  price_per_sqft DECIMAL(12,2) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vendor_frame (vendor_id, frame_id),
  KEY idx_vfp_frame (frame_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE cart_items
  ADD COLUMN material_style_id BIGINT UNSIGNED NULL AFTER material_id;
ALTER TABLE cart_items
  ADD COLUMN frame_id BIGINT UNSIGNED NULL AFTER material_style_id;

ALTER TABLE order_items
  ADD COLUMN material_style_id BIGINT UNSIGNED NULL AFTER material_id;
ALTER TABLE order_items
  ADD COLUMN frame_id BIGINT UNSIGNED NULL AFTER material_style_id;
ALTER TABLE order_items
  ADD COLUMN material_style_price_per_sqft DECIMAL(12,4) NULL AFTER material_cost;
ALTER TABLE order_items
  ADD COLUMN material_style_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER material_style_price_per_sqft;
ALTER TABLE order_items
  ADD COLUMN frame_price_per_sqft DECIMAL(12,4) NULL AFTER material_style_cost;
ALTER TABLE order_items
  ADD COLUMN frame_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER frame_price_per_sqft;
