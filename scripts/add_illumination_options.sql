-- Lit / Non-Lit illumination options (per product type), admin + vendor price per sq ft
-- MariaDB-safe version (no dynamic PREPARE blocks).
-- NOTE:
-- 1) product_type_id and vendor_id are kept without external FK to avoid type-mismatch issues across legacy schemas.
-- 2) illumination_option_id keeps FK to illumination_options(id).

CREATE TABLE IF NOT EXISTS illumination_options (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_type_id INT UNSIGNED NOT NULL,
  category ENUM('lit','non_lit') NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  preview_image_url TEXT NULL,
  admin_price_per_sqft DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_io_product_category (product_type_id, category, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vendor_illumination_pricing (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  illumination_option_id BIGINT UNSIGNED NOT NULL,
  price_per_sqft DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_vendor_illumination (vendor_id, illumination_option_id),
  KEY idx_vip_option (illumination_option_id),
  CONSTRAINT fk_vip_option
    FOREIGN KEY (illumination_option_id) REFERENCES illumination_options(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- cart_items / order_items: add columns if missing
ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS illumination_option_id BIGINT UNSIGNED NULL;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS illumination_option_id BIGINT UNSIGNED NULL;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS illumination_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00;

ALTER TABLE illumination_options
  MODIFY COLUMN product_type_id INT UNSIGNED NOT NULL;

-- Add lit/non-lit options via Admin panel after migration.
