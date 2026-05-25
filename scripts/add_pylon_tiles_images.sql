-- Pylon: multiple tile artwork images (S3 URLs stored as JSON array)

SET @db = DATABASE();

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'pylon_tiles_images') = 0,
  'ALTER TABLE cart_items ADD COLUMN pylon_tiles_images JSON NULL AFTER pylon_tiles_count',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'pylon_tiles_images') = 0,
  'ALTER TABLE order_items ADD COLUMN pylon_tiles_images JSON NULL AFTER pylon_tiles_count',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
