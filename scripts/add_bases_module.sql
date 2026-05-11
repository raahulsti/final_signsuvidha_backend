-- Physical / structural bases (per product type), priced per sq ft — mirrors materials pattern.
-- Run after product_types exists.

CREATE TABLE IF NOT EXISTS bases (
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
  KEY idx_bases_product_type (product_type_id),
  KEY idx_bases_active (is_active)
);

CREATE TABLE IF NOT EXISTS vendor_base_pricing (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  base_id BIGINT UNSIGNED NOT NULL,
  price_per_sqft DECIMAL(12,2) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vendor_base (vendor_id, base_id)
);

-- MySQL (older than 8.0.12) does not support "ADD COLUMN IF NOT EXISTS".
-- Run each line once. If you see Error 1060 "Duplicate column name", the column is already there — skip that line.

ALTER TABLE cart_items
  ADD COLUMN base_id BIGINT UNSIGNED NULL AFTER material_id;

ALTER TABLE order_items
  ADD COLUMN base_id BIGINT UNSIGNED NULL AFTER material_id;

ALTER TABLE order_items
  ADD COLUMN base_price_per_sqft DECIMAL(12,4) NULL AFTER material_cost;

ALTER TABLE order_items
  ADD COLUMN base_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER base_price_per_sqft;
