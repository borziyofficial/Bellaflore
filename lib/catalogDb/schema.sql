CREATE TABLE IF NOT EXISTS catalog_products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  short_description TEXT NOT NULL DEFAULT '',
  full_description TEXT NOT NULL DEFAULT '',
  composition TEXT NOT NULL DEFAULT '',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  sizes JSONB NOT NULL DEFAULT '{}'::jsonb,
  old_price_rub INTEGER,
  flower_count INTEGER,
  height_cm INTEGER,
  width_cm INTEGER,
  color_palette JSONB NOT NULL DEFAULT '[]'::jsonb,
  occasion TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  seo_h1 TEXT NOT NULL DEFAULT '',
  seo_slug TEXT NOT NULL DEFAULT '',
  seo_image_alt TEXT NOT NULL DEFAULT '',
  seo_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  seo_faq JSONB NOT NULL DEFAULT '[]'::jsonb,
  open_graph_title TEXT NOT NULL DEFAULT '',
  open_graph_description TEXT NOT NULL DEFAULT '',
  schema_product_json_ld JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_new BOOLEAN NOT NULL DEFAULT FALSE,
  is_bestseller BOOLEAN NOT NULL DEFAULT FALSE,
  is_promotion BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS old_price_rub INTEGER;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS flower_count INTEGER;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS height_cm INTEGER;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS width_cm INTEGER;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS color_palette JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS occasion TEXT NOT NULL DEFAULT '';
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS is_promotion BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_catalog_products_status ON catalog_products(status);
CREATE INDEX IF NOT EXISTS idx_catalog_products_slug ON catalog_products(slug);
