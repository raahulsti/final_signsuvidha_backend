CREATE TABLE IF NOT EXISTS order_serial_counters (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  fy_label VARCHAR(16) NOT NULL,
  seller_type ENUM('admin','vendor') NOT NULL,
  seller_vendor_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
  last_order_serial BIGINT UNSIGNED NOT NULL DEFAULT 0,
  last_invoice_serial BIGINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_order_serial_scope (fy_label, seller_type, seller_vendor_id)
);

CREATE TABLE IF NOT EXISTS order_invoice_numbers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  invoice_number VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_invoice_order (order_id),
  UNIQUE KEY uq_invoice_number (invoice_number)
);

CREATE TABLE IF NOT EXISTS tax_config (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  gst_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

INSERT INTO tax_config (gst_percent, is_active)
SELECT 18.00, 1
WHERE NOT EXISTS (SELECT 1 FROM tax_config WHERE is_active = 1);

CREATE TABLE IF NOT EXISTS order_payment_batches (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_user_id BIGINT UNSIGNED NOT NULL,
  batch_number VARCHAR(64) NOT NULL,
  total_order_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  gst_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payable_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(32) NULL,
  gateway_order_id VARCHAR(128) NULL,
  gateway_payment_id VARCHAR(128) NULL,
  gateway_signature VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_batch_number (batch_number)
);

CREATE TABLE IF NOT EXISTS order_payment_batch_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_batch_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_batch_order (order_id),
  KEY idx_batch_items_batch (payment_batch_id)
);
