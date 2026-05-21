-- Fix: Illegal mix of collations on listed_product_size vs variants.size
-- Run once if POST /customer/cart/listed fails with collation error

SET @db = DATABASE();

-- Align cart_items.listed_product_size with variants ENUM collation
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'listed_product_size') > 0,
  'ALTER TABLE cart_items MODIFY listed_product_size ENUM(''regular'',''medium'',''large'') NULL COLLATE utf8mb4_unicode_ci',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'listed_product_size') > 0,
  'ALTER TABLE order_items MODIFY listed_product_size ENUM(''regular'',''medium'',''large'') NULL COLLATE utf8mb4_unicode_ci',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Ensure variant table uses same collation
ALTER TABLE listed_product_variants
  MODIFY size ENUM('regular','medium','large') NOT NULL COLLATE utf8mb4_unicode_ci;
