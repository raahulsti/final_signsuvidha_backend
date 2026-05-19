-- Add Border + Lollipop Element (product_type_id 6 = lollipop_sign)
-- Fixed pricing; lit on border = admin_price + lit_price (additive).

CREATE TABLE IF NOT EXISTS add_borders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_type_id BIGINT UNSIGNED NOT NULL DEFAULT 6,
  shape VARCHAR(20) NOT NULL COMMENT 'circle|oval|square',
  size VARCHAR(20) NOT NULL COMMENT 'small|medium|large',
  name VARCHAR(150) NULL,
  description VARCHAR(1000) NULL,
  thumbnail_url VARCHAR(500) NULL,
  file_url VARCHAR(500) NULL,
  admin_price DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Non-lit base price',
  lit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Lit add-on (added to admin_price when lit)',
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_add_border_pt_shape_size (product_type_id, shape, size),
  KEY idx_add_borders_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lollipop_elements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_type_id BIGINT UNSIGNED NOT NULL DEFAULT 6,
  shape VARCHAR(20) NOT NULL COMMENT 'circle|oval|square',
  name VARCHAR(150) NULL,
  description VARCHAR(1000) NULL,
  thumbnail_url VARCHAR(500) NULL,
  file_url VARCHAR(500) NULL,
  admin_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lollipop_element_pt_shape (product_type_id, shape),
  KEY idx_lollipop_elements_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vendor_add_border_pricing (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  add_border_id BIGINT UNSIGNED NOT NULL,
  price DECIMAL(12,2) NOT NULL COMMENT 'Non-lit base',
  lit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Lit add-on',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vendor_add_border (vendor_id, add_border_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vendor_lollipop_element_pricing (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  lollipop_element_id BIGINT UNSIGNED NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vendor_lollipop_element (vendor_id, lollipop_element_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @db = DATABASE();

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'add_border_id') > 0,
  'SELECT 1',
  'ALTER TABLE cart_items ADD COLUMN add_border_id BIGINT UNSIGNED NULL AFTER wallpaper_id'
));
PREPARE stmt FROM @preparedStatement; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'border_is_lit') > 0,
  'SELECT 1',
  'ALTER TABLE cart_items ADD COLUMN border_is_lit TINYINT(1) NOT NULL DEFAULT 0 AFTER add_border_id'
));
PREPARE stmt FROM @preparedStatement; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'lollipop_element_id') > 0,
  'SELECT 1',
  'ALTER TABLE cart_items ADD COLUMN lollipop_element_id BIGINT UNSIGNED NULL AFTER border_is_lit'
));
PREPARE stmt FROM @preparedStatement; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'add_border_id') > 0,
  'SELECT 1',
  'ALTER TABLE order_items ADD COLUMN add_border_id BIGINT UNSIGNED NULL AFTER wallpaper_id'
));
PREPARE stmt FROM @preparedStatement; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'border_is_lit') > 0,
  'SELECT 1',
  'ALTER TABLE order_items ADD COLUMN border_is_lit TINYINT(1) NOT NULL DEFAULT 0 AFTER add_border_id'
));
PREPARE stmt FROM @preparedStatement; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'lollipop_element_id') > 0,
  'SELECT 1',
  'ALTER TABLE order_items ADD COLUMN lollipop_element_id BIGINT UNSIGNED NULL AFTER border_is_lit'
));
PREPARE stmt FROM @preparedStatement; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'add_border_base_price') > 0,
  'SELECT 1',
  'ALTER TABLE order_items ADD COLUMN add_border_base_price DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER lollipop_element_id'
));
PREPARE stmt FROM @preparedStatement; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'add_border_lit_extra') > 0,
  'SELECT 1',
  'ALTER TABLE order_items ADD COLUMN add_border_lit_extra DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER add_border_base_price'
));
PREPARE stmt FROM @preparedStatement; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'add_border_cost') > 0,
  'SELECT 1',
  'ALTER TABLE order_items ADD COLUMN add_border_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER add_border_lit_extra'
));
PREPARE stmt FROM @preparedStatement; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'lollipop_element_cost') > 0,
  'SELECT 1',
  'ALTER TABLE order_items ADD COLUMN lollipop_element_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER add_border_cost'
));
PREPARE stmt FROM @preparedStatement; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Lollipop: fixed price — dimension unit not required (drop FK → MODIFY → re-add FK)
-- Run scripts/lollipop_null_dimension_unit.sql separately if FK fk_oi_du exists on order_items.
