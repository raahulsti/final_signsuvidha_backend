-- Pylon module: catalog pylons + categories (category price + tiles name/price) + cart/order + vendor pricing

CREATE TABLE IF NOT EXISTS pylons (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_type_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT NULL,
  thumbnail_url VARCHAR(500) NULL,
  file_url VARCHAR(500) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pylons_active (is_active),
  KEY idx_pylons_pt (product_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pylon_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  pylon_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL COMMENT 'e.g. 4M, 6M',
  admin_category_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tiles_name VARCHAR(150) NOT NULL COMMENT 'e.g. 2x2, 4x4',
  admin_tiles_price DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Per tile unit price',
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pylon_category_name (pylon_id, name),
  KEY idx_pylon_categories_pylon (pylon_id),
  KEY idx_pylon_categories_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vendor_pylon_category_pricing (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  pylon_category_id BIGINT UNSIGNED NOT NULL,
  category_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tiles_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vendor_pylon_category (vendor_id, pylon_category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @db = DATABASE();

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'pylon_id') = 0,
  'ALTER TABLE cart_items ADD COLUMN pylon_id BIGINT UNSIGNED NULL AFTER lollipop_element_id,
   ADD COLUMN pylon_category_id BIGINT UNSIGNED NULL AFTER pylon_id,
   ADD COLUMN pylon_tiles_count INT NOT NULL DEFAULT 0 AFTER pylon_category_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'pylon_id') = 0,
  'ALTER TABLE order_items ADD COLUMN pylon_id BIGINT UNSIGNED NULL AFTER lollipop_element_id,
   ADD COLUMN pylon_category_id BIGINT UNSIGNED NULL AFTER pylon_id,
   ADD COLUMN pylon_tiles_count INT NOT NULL DEFAULT 0 AFTER pylon_category_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'pylon_category_price') = 0,
  'ALTER TABLE order_items
   ADD COLUMN pylon_category_price DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER pylon_tiles_count,
   ADD COLUMN pylon_tiles_price DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER pylon_category_price,
   ADD COLUMN pylon_category_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER pylon_tiles_price,
   ADD COLUMN pylon_tiles_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER pylon_category_cost',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
