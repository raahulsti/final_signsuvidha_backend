-- In-app notifications (order events first; push can be added later)
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(80) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  reference_type VARCHAR(50) NULL,
  reference_id BIGINT UNSIGNED NULL,
  data JSON NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  read_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user_id (user_id),
  KEY idx_notifications_user_unread (user_id, is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
