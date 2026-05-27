-- Frozen display snapshot for order line items (preserves names/images if masters are deactivated)
SET NAMES utf8mb4;

SET @db = DATABASE();

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'item_snapshot') = 0,
  'ALTER TABLE order_items ADD COLUMN item_snapshot JSON NULL AFTER preview_image_url',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
