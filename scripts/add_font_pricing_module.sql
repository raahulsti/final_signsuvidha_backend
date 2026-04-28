-- Font pricing by product type (admin + vendor override)
-- MariaDB-safe version (no dynamic PREPARE blocks).
-- NOTE:
-- 1) font_id / product_type_id / vendor_id are kept without external FKs to avoid
--    legacy schema type mismatch errors (errno 150) on production DBs.
-- 2) Uniqueness + indexes are enforced for correctness/performance.

CREATE TABLE IF NOT EXISTS font_product_type_pricing (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  font_id BIGINT UNSIGNED NOT NULL,
  product_type_id INT UNSIGNED NOT NULL,
  admin_price_extra DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_font_product_type_pricing (font_id, product_type_id),
  KEY idx_fptp_product_type (product_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vendor_font_pricing (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  font_id BIGINT UNSIGNED NOT NULL,
  product_type_id INT UNSIGNED NOT NULL,
  price_extra DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_vendor_font_product (vendor_id, font_id, product_type_id),
  KEY idx_vfp_vendor (vendor_id),
  KEY idx_vfp_font (font_id),
  KEY idx_vfp_product_type (product_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Backfill existing font-product mappings with zero admin price.
INSERT INTO font_product_type_pricing (font_id, product_type_id, admin_price_extra, is_active)
SELECT ptf.font_id, ptf.product_type_id, 0.00, 1
FROM product_type_fonts ptf
LEFT JOIN font_product_type_pricing fptp
  ON fptp.font_id = ptf.font_id
 AND fptp.product_type_id = ptf.product_type_id
WHERE fptp.id IS NULL;

-- Sample admin pricing rows (edit ids as per your DB)
INSERT INTO font_product_type_pricing (font_id, product_type_id, admin_price_extra, is_active)
VALUES
  (1, 1, 15.00, 1),
  (1, 2, 12.00, 1),
  (2, 1, 20.00, 1),
  (3, 3, 18.50, 1)
ON DUPLICATE KEY UPDATE admin_price_extra = VALUES(admin_price_extra), is_active = VALUES(is_active);
