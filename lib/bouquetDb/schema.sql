CREATE TABLE IF NOT EXISTS admin_bouquets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  category_id TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  base_price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (
    status IN ('active', 'hidden', 'out_of_stock', 'coming_soon', 'draft')
  ),
  display_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  display_priority INTEGER NOT NULL DEFAULT 100,
  badge TEXT NOT NULL DEFAULT 'none',
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  sizes JSONB NOT NULL DEFAULT '{}'::jsonb,
  seo JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_bouquets_status ON admin_bouquets(status);
CREATE INDEX IF NOT EXISTS idx_admin_bouquets_slug ON admin_bouquets(slug);
CREATE INDEX IF NOT EXISTS idx_admin_bouquets_category_id ON admin_bouquets(category_id);
CREATE INDEX IF NOT EXISTS idx_admin_bouquets_updated_at ON admin_bouquets(updated_at DESC);

CREATE TABLE IF NOT EXISTS admin_bouquet_category_storage (
  id TEXT PRIMARY KEY DEFAULT 'default',
  payload JSONB NOT NULL DEFAULT '{"custom":[],"overrides":{}}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
