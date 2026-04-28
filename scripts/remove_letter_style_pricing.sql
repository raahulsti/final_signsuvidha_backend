-- Remove legacy letter-style pricing fields/modules.
-- MariaDB-safe style used in this project.

-- 1) Drop vendor letter-style pricing table (if exists)
DROP TABLE IF EXISTS vendor_letter_style_pricing;

-- 2) Remove pricing columns from letter_styles (if present)
ALTER TABLE letter_styles
  DROP COLUMN IF EXISTS price_multiplier,
  DROP COLUMN IF EXISTS admin_price_extra;
