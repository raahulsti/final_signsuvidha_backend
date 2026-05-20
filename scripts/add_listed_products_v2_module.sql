-- Listed products v2: multiple images + size variants (regular/medium/large) + cart/order support

CREATE TABLE IF NOT EXISTS listed_product_images (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  listed_product_id BIGINT UNSIGNED NOT NULL,
  file_url          VARCHAR(500)    NOT NULL,
  sort_order        INT             NOT NULL DEFAULT 0,
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_lp_images_product (listed_product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listed_product_variants (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  listed_product_id BIGINT UNSIGNED NOT NULL,
  size              ENUM('regular','medium','large') NOT NULL,
  admin_price       DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  is_active         TINYINT(1)      NOT NULL DEFAULT 1,
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lp_variant_size (listed_product_id, size),
  KEY idx_lp_variants_product (listed_product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- cart_items: listed product line (nullable = customizer item)
SET @db = DATABASE();

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'listed_product_id') = 0,
  'ALTER TABLE cart_items ADD COLUMN listed_product_id BIGINT UNSIGNED NULL AFTER user_id,
   ADD COLUMN listed_product_size VARCHAR(20) NULL AFTER listed_product_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'listed_product_id') = 0,
  'ALTER TABLE order_items ADD COLUMN listed_product_id BIGINT UNSIGNED NULL AFTER order_id,
   ADD COLUMN listed_product_size VARCHAR(20) NULL AFTER listed_product_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Migrate legacy single admin_price into regular variant (if listed_products exists)
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'listed_products') > 0
  AND (SELECT COUNT(*) FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'listed_products' AND COLUMN_NAME = 'admin_price') > 0,
  'INSERT IGNORE INTO listed_product_variants (listed_product_id, size, admin_price, is_active)
   SELECT id, ''regular'', COALESCE(admin_price, 0), 1 FROM listed_products',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Copy thumbnail to images table if empty
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'listed_products' AND COLUMN_NAME = 'thumbnail_url') > 0,
  'INSERT IGNORE INTO listed_product_images (listed_product_id, file_url, sort_order)
   SELECT lp.id, lp.thumbnail_url, 0 FROM listed_products lp
   WHERE lp.thumbnail_url IS NOT NULL AND lp.thumbnail_url <> ''''
     AND NOT EXISTS (SELECT 1 FROM listed_product_images i WHERE i.listed_product_id = lp.id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
