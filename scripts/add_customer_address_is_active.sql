-- Soft delete for customer addresses: inactive rows stay for order FK references

SET @db = DATABASE();

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'customer_addresses' AND COLUMN_NAME = 'is_active') = 0,
  'ALTER TABLE customer_addresses
   ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER billing_type',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
