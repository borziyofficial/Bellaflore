BEGIN;

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  public_number VARCHAR(32) NOT NULL UNIQUE,
  idempotency_key VARCHAR(128) NOT NULL UNIQUE,
  request_fingerprint CHAR(64) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_latitude DOUBLE PRECISION NOT NULL,
  delivery_longitude DOUBLE PRECISION NOT NULL,
  delivery_zone_id TEXT NOT NULL,
  delivery_date DATE NOT NULL,
  delivery_interval TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (
    payment_method IN ('cardTransfer', 'cashOnDelivery')
  ),
  customer_comment TEXT NOT NULL DEFAULT '',
  subtotal BIGINT NOT NULL CHECK (subtotal >= 0),
  delivery_cost BIGINT NOT NULL CHECK (delivery_cost >= 0),
  total BIGINT NOT NULL CHECK (total = subtotal + delivery_cost),
  currency CHAR(3) NOT NULL DEFAULT 'RUB' CHECK (currency = 'RUB'),
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (
    status IN (
      'NEW',
      'CONFIRMED',
      'PREPARING',
      'COURIER_ASSIGNED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED'
    )
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_source TEXT NOT NULL CHECK (
    product_source IN ('catalog_products', 'admin_bouquets')
  ),
  product_id TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  product_name TEXT NOT NULL,
  size_code TEXT NOT NULL CHECK (size_code IN ('S', 'M', 'L', 'XL')),
  unit_price BIGINT NOT NULL CHECK (unit_price > 0),
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  line_total BIGINT NOT NULL CHECK (line_total = unit_price * quantity),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_created_at
  ON orders(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items(order_id);

COMMIT;
