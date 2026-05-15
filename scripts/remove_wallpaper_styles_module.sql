-- =============================================================================
-- Remove wallpaper "styles" / tier columns (rollback add_wallpaper_types.sql)
-- Safe to re-run: each step only runs if object exists.
-- =============================================================================

SET @db = DATABASE();

-- Drop index on materials (must run before dropping wallpaper_type column)
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'materials' AND INDEX_NAME = 'idx_materials_pt_wallpaper_type') > 0,
  'ALTER TABLE materials DROP INDEX idx_materials_pt_wallpaper_type',
  'SELECT 1 AS skip_drop_idx_materials_wallpaper'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'materials' AND COLUMN_NAME = 'wallpaper_type') > 0,
  'ALTER TABLE materials DROP COLUMN wallpaper_type',
  'SELECT 1 AS skip_drop_materials_wallpaper_type'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'wallpaper_finish') > 0,
  'ALTER TABLE cart_items DROP COLUMN wallpaper_finish',
  'SELECT 1 AS skip_drop_cart_wallpaper_finish'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'wallpaper_finish') > 0,
  'ALTER TABLE order_items DROP COLUMN wallpaper_finish',
  'SELECT 1 AS skip_drop_order_wallpaper_finish'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Legacy table from older experiments (optional)
DROP TABLE IF EXISTS wallpaper_styles;
