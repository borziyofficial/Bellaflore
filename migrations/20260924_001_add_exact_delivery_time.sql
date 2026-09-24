BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_mode TEXT NOT NULL DEFAULT 'interval',
  ADD COLUMN IF NOT EXISTS delivery_exact_time TIME,
  ADD COLUMN IF NOT EXISTS delivery_time_surcharge BIGINT NOT NULL DEFAULT 0;

ALTER TABLE orders ALTER COLUMN delivery_interval DROP NOT NULL;

ALTER TABLE order_drafts
  ADD COLUMN IF NOT EXISTS delivery_mode TEXT,
  ADD COLUMN IF NOT EXISTS delivery_exact_time TIME,
  ADD COLUMN IF NOT EXISTS delivery_time_surcharge BIGINT NOT NULL DEFAULT 0;

-- A draft can be created before the customer chooses any delivery time.
-- These ALTERs also repair installations that applied the earlier default.
ALTER TABLE order_drafts
  ALTER COLUMN delivery_mode DROP DEFAULT,
  ALTER COLUMN delivery_mode DROP NOT NULL;

ALTER TABLE order_drafts DROP CONSTRAINT IF EXISTS order_drafts_delivery_time_mode_check;

UPDATE order_drafts
SET delivery_mode = NULL
WHERE delivery_mode = 'interval'
  AND delivery_interval IS NULL
  AND delivery_exact_time IS NULL
  AND delivery_time_surcharge = 0;

UPDATE order_drafts
SET delivery_mode = 'interval'
WHERE delivery_mode IS NULL
  AND delivery_interval IS NOT NULL
  AND delivery_exact_time IS NULL;

UPDATE order_drafts
SET delivery_mode = 'exact'
WHERE delivery_mode IS NULL
  AND delivery_interval IS NULL
  AND delivery_exact_time IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_delivery_time_mode_check') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_delivery_time_mode_check CHECK (
      (delivery_mode = 'interval' AND delivery_interval IS NOT NULL
        AND delivery_exact_time IS NULL AND delivery_time_surcharge = 0)
      OR
      (delivery_mode = 'exact' AND delivery_interval IS NULL
        AND delivery_exact_time IS NOT NULL AND delivery_time_surcharge >= 0)
    );
  END IF;

END
$$;

ALTER TABLE order_drafts ADD CONSTRAINT order_drafts_delivery_time_mode_check CHECK (
  (delivery_mode IS NULL AND delivery_interval IS NULL
    AND delivery_exact_time IS NULL AND delivery_time_surcharge = 0)
  OR
  (delivery_mode = 'interval' AND delivery_interval IS NOT NULL
    AND delivery_exact_time IS NULL AND delivery_time_surcharge = 0)
  OR
  (delivery_mode = 'exact' AND delivery_interval IS NULL
    AND delivery_exact_time IS NOT NULL AND delivery_time_surcharge >= 0)
);

COMMIT;
