-- Lollipop elements: remove shape; catalog is name + description + image + price (product_type_id 6).

SET @db = DATABASE();

-- Backfill name from shape where name empty (before dropping shape column)
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'lollipop_elements' AND COLUMN_NAME = 'shape') > 0,
  'UPDATE lollipop_elements SET name = COALESCE(NULLIF(TRIM(name), ''''), shape) WHERE name IS NULL OR TRIM(name) = ''''',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Drop unique key on (product_type_id, shape) if present
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'lollipop_elements' AND INDEX_NAME = 'uq_lollipop_element_pt_shape') > 0,
  'ALTER TABLE lollipop_elements DROP INDEX uq_lollipop_element_pt_shape',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'lollipop_elements' AND COLUMN_NAME = 'shape') > 0,
  'ALTER TABLE lollipop_elements DROP COLUMN shape',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement; EXECUTE stmt; DEALLOCATE PREPARE stmt;
