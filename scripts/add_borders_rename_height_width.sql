-- Rename add_borders.name → height, description → width

SET @db = DATABASE();

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'add_borders' AND COLUMN_NAME = 'name') > 0
   AND (SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'add_borders' AND COLUMN_NAME = 'height') = 0,
  'ALTER TABLE add_borders CHANGE COLUMN name height VARCHAR(150) NULL',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'add_borders' AND COLUMN_NAME = 'description') > 0
   AND (SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'add_borders' AND COLUMN_NAME = 'width') = 0,
  'ALTER TABLE add_borders CHANGE COLUMN description width VARCHAR(150) NULL',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement; EXECUTE stmt; DEALLOCATE PREPARE stmt;
