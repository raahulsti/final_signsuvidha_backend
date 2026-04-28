-- Hard cleanup: remove letter_style_id from cart/order transactional flow
-- Static MariaDB-safe format (no PREPARE)

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE cart_items
  DROP COLUMN IF EXISTS letter_style_id;

ALTER TABLE order_items
  DROP COLUMN IF EXISTS letter_style_id;

ALTER TABLE order_items
  DROP COLUMN IF EXISTS letter_style_extra;

SET FOREIGN_KEY_CHECKS = 1;
