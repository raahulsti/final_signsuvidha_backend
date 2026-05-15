-- Wallpapers master (same pattern as frames) + vendor per-sq-ft pricing + cart/order FK.
-- wallpaper_type: static tier regular | premium | prestige (stored on row, not a lookup table).

CREATE TABLE IF NOT EXISTS wallpapers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_type_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(1000) NULL,
  wallpaper_type VARCHAR(20) NOT NULL DEFAULT 'regular' COMMENT 'regular|premium|prestige',
  thumbnail_url VARCHAR(500) NULL,
  file_url VARCHAR(500) NULL,
  admin_price_per_sqft DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wallpapers_product (product_type_id),
  KEY idx_wallpapers_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vendor_wallpaper_pricing (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  wallpaper_id BIGINT UNSIGNED NOT NULL,
  price_per_sqft DECIMAL(12,2) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vendor_wallpaper (vendor_id, wallpaper_id),
  KEY idx_vwp_wallpaper (wallpaper_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @db = DATABASE();

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'wallpaper_id') > 0,
  'SELECT 1',
  'ALTER TABLE cart_items ADD COLUMN wallpaper_id BIGINT UNSIGNED NULL AFTER frame_id'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'wallpaper_id') > 0,
  'SELECT 1',
  'ALTER TABLE order_items ADD COLUMN wallpaper_id BIGINT UNSIGNED NULL AFTER frame_id'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'wallpaper_price_per_sqft') > 0,
  'SELECT 1',
  'ALTER TABLE order_items ADD COLUMN wallpaper_price_per_sqft DECIMAL(12,4) NULL AFTER frame_cost'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'wallpaper_cost') > 0,
  'SELECT 1',
  'ALTER TABLE order_items ADD COLUMN wallpaper_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER wallpaper_price_per_sqft'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
