-- Listed product variants: height & width per size tier (display only, not stored on order_items)

SET @db = DATABASE();

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'listed_product_variants' AND COLUMN_NAME = 'height') = 0,
  'ALTER TABLE listed_product_variants
   ADD COLUMN height VARCHAR(150) NULL AFTER admin_price,
   ADD COLUMN width VARCHAR(150) NULL AFTER height',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
