-- 3D Signage: per-entry text & logo dimensions (area = base + sum(text) + sum(logo))
-- Safe to re-run. Adds JSON columns to cart_items and order_items if missing.
SET NAMES utf8mb4;

SET @db = DATABASE();

-- cart_items.text_dimension
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'text_dimension') = 0,
  'ALTER TABLE cart_items ADD COLUMN text_dimension JSON NULL AFTER text_layers',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- cart_items.logo_dimension
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'logo_dimension') = 0,
  'ALTER TABLE cart_items ADD COLUMN logo_dimension JSON NULL AFTER text_dimension',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- order_items.text_dimension
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'text_dimension') = 0,
  'ALTER TABLE order_items ADD COLUMN text_dimension JSON NULL AFTER text_layers',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- order_items.logo_dimension
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'logo_dimension') = 0,
  'ALTER TABLE order_items ADD COLUMN logo_dimension JSON NULL AFTER text_dimension',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- order_items: frozen area breakdown so panels can show how the area was composed
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'area_sqft') = 0,
  'ALTER TABLE order_items ADD COLUMN area_sqft DECIMAL(12,4) NULL AFTER logo_dimension',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'base_area_sqft') = 0,
  'ALTER TABLE order_items ADD COLUMN base_area_sqft DECIMAL(12,4) NULL AFTER area_sqft',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'text_area_sqft') = 0,
  'ALTER TABLE order_items ADD COLUMN text_area_sqft DECIMAL(12,4) NULL AFTER base_area_sqft',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'logo_area_sqft') = 0,
  'ALTER TABLE order_items ADD COLUMN logo_area_sqft DECIMAL(12,4) NULL AFTER text_area_sqft',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
