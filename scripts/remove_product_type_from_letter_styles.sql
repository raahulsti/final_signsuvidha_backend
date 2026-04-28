-- Remove product_type mapping from letter_styles master
-- Static MariaDB-safe format (no PREPARE)

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE letter_styles
  DROP FOREIGN KEY fk_ls_pt;

ALTER TABLE letter_styles
  DROP COLUMN IF EXISTS product_type_id;

SET FOREIGN_KEY_CHECKS = 1;
