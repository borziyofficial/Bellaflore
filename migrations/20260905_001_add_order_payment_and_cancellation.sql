BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'PENDING';

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_status_check'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_payment_status_check
      CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED'));
  END IF;
END
$$;

COMMENT ON COLUMN orders.payment_status IS
  'Payment lifecycle, independent from the order fulfillment status.';

COMMENT ON COLUMN orders.cancellation_reason IS
  'Administrator-provided reason when an order is cancelled.';

COMMIT;
