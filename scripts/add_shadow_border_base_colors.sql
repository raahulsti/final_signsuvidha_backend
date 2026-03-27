-- Migration: add shadow, border, and base color masters
-- Safe to run multiple times.

START TRANSACTION;

CREATE TABLE IF NOT EXISTS shadow_colors (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NULL,
  hex_code VARCHAR(7) NOT NULL,
  admin_price_extra DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_shadow_colors_active (is_active),
  KEY idx_shadow_colors_hex (hex_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS border_colors (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NULL,
  hex_code VARCHAR(7) NOT NULL,
  admin_price_extra DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_border_colors_active (is_active),
  KEY idx_border_colors_hex (hex_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS base_colors (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NULL,
  hex_code VARCHAR(7) NOT NULL,
  admin_price_extra DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_base_colors_active (is_active),
  KEY idx_base_colors_hex (hex_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_type_shadow_colors (
  product_type_id BIGINT UNSIGNED NOT NULL,
  shadow_color_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_type_id, shadow_color_id),
  KEY idx_pt_shadow_color (shadow_color_id),
  CONSTRAINT fk_pt_shadow_product_type
    FOREIGN KEY (product_type_id) REFERENCES product_types(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pt_shadow_color
    FOREIGN KEY (shadow_color_id) REFERENCES shadow_colors(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_type_border_colors (
  product_type_id BIGINT UNSIGNED NOT NULL,
  border_color_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_type_id, border_color_id),
  KEY idx_pt_border_color (border_color_id),
  CONSTRAINT fk_pt_border_product_type
    FOREIGN KEY (product_type_id) REFERENCES product_types(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pt_border_color
    FOREIGN KEY (border_color_id) REFERENCES border_colors(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_type_base_colors (
  product_type_id BIGINT UNSIGNED NOT NULL,
  base_color_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_type_id, base_color_id),
  KEY idx_pt_base_color (base_color_id),
  CONSTRAINT fk_pt_base_product_type
    FOREIGN KEY (product_type_id) REFERENCES product_types(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pt_base_color
    FOREIGN KEY (base_color_id) REFERENCES base_colors(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

COMMIT;
