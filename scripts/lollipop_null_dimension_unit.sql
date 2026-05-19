-- Lollipop: dimension_unit_id = NULL allowed (no area-based sizing).
--
-- IMPORTANT: For checkout you only need steps 1–3 on order_items.
-- Re-adding the FK (step 5) is OPTIONAL. Skip it if you get errno 150.

-- ═══════════════════════════════════════════════════════════════════════════
-- order_items
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Drop FK (skip if already dropped)
ALTER TABLE order_items DROP FOREIGN KEY fk_oi_du;

-- 2) Match column type to dimension_units.id (usually BIGINT signed, not UNSIGNED)
ALTER TABLE order_items
  MODIFY COLUMN dimension_unit_id BIGINT NULL;

-- 3) Clear invalid references (0 or missing unit) — required before FK can be re-added
UPDATE order_items oi
LEFT JOIN dimension_units du ON du.id = oi.dimension_unit_id
SET oi.dimension_unit_id = NULL
WHERE oi.dimension_unit_id IS NOT NULL
  AND du.id IS NULL;

-- 4) CHECKOUT WORKS AFTER STEP 3 — you can stop here.

-- 5) OPTIONAL: Re-create FK (only if step 4 below succeeds; else leave FK off)
--    First verify types match:
--    SELECT COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS
--    WHERE TABLE_SCHEMA = DATABASE()
--      AND TABLE_NAME IN ('order_items','dimension_units')
--      AND COLUMN_NAME IN ('id','dimension_unit_id');

ALTER TABLE order_items
  ADD CONSTRAINT fk_oi_du
  FOREIGN KEY (dimension_unit_id) REFERENCES dimension_units (id)
  ON DELETE SET NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- cart_items (only if you have fk_ci_du — check: SHOW CREATE TABLE cart_items;)
-- ═══════════════════════════════════════════════════════════════════════════

-- ALTER TABLE cart_items DROP FOREIGN KEY fk_ci_du;
-- ALTER TABLE cart_items MODIFY COLUMN dimension_unit_id BIGINT NULL;
-- UPDATE cart_items ci
-- LEFT JOIN dimension_units du ON du.id = ci.dimension_unit_id
-- SET ci.dimension_unit_id = NULL
-- WHERE ci.dimension_unit_id IS NOT NULL AND du.id IS NULL;
-- ALTER TABLE cart_items
--   ADD CONSTRAINT fk_ci_du
--   FOREIGN KEY (dimension_unit_id) REFERENCES dimension_units (id)
--   ON DELETE SET NULL;
