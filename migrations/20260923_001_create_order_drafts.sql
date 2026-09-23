BEGIN;

CREATE TABLE IF NOT EXISTS order_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT,
  customer_phone TEXT,
  recipient_name TEXT,
  recipient_phone TEXT,
  delivery_address TEXT,
  delivery_latitude NUMERIC(10, 8),
  delivery_longitude NUMERIC(10, 8),
  delivery_zone_id TEXT,
  delivery_date DATE,
  delivery_interval TEXT,
  payment_method TEXT,
  customer_comment TEXT DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  conversation_state JSONB NOT NULL DEFAULT '{"turns": []}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'abandoned', 'converted')),
  converted_to_order_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  abandoned_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_order_drafts_customer_phone
  ON order_drafts(customer_phone) WHERE customer_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_drafts_status_created_at
  ON order_drafts(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_drafts_active
  ON order_drafts(created_at DESC) WHERE status = 'active';

COMMIT;
