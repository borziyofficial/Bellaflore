import { readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";
import { getDatabaseUrl } from "@/lib/catalogDb/config";
import type { StoredCatalogProduct } from "@/lib/catalogDb/types";

let sqlClient: ReturnType<typeof postgres> | null = null;
let schemaReady: Promise<void> | null = null;

function getSqlClient() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    return null;
  }

  if (!sqlClient) {
    sqlClient = postgres(databaseUrl, { max: 5 });
  }

  return sqlClient;
}

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getSqlClient();
      if (!sql) {
        return;
      }

      const schemaPath = join(process.cwd(), "lib", "catalogDb", "schema.sql");
      const schemaSql = await readFile(schemaPath, "utf8");
      await sql.unsafe(schemaSql);
    })();
  }

  await schemaReady;
}

type CatalogRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: StoredCatalogProduct["status"];
  short_description: string;
  full_description: string;
  composition: string;
  tags: string[];
  sizes: StoredCatalogProduct["sizes"];
  old_price_rub: number | null;
  flower_count: number | null;
  height_cm: number | null;
  width_cm: number | null;
  color_palette: string[];
  occasion: string;
  image_url: string;
  gallery_images: string[];
  images: StoredCatalogProduct["images"];
  seo_title: string;
  seo_description: string;
  seo_h1: string;
  seo_slug: string;
  seo_image_alt: string;
  seo_keywords: string[];
  seo_faq: StoredCatalogProduct["seoFaq"];
  open_graph_title: string;
  open_graph_description: string;
  schema_product_json_ld: Record<string, unknown>;
  is_featured: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  is_promotion: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  catalog_number: string;
};

function formatCatalogNumber(rowNumber: number): string {
  return `BF-${String(rowNumber).padStart(3, "0")}`;
}

function rowToProduct(row: CatalogRow): StoredCatalogProduct {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    status: row.status,
    shortDescription: row.short_description,
    fullDescription: row.full_description,
    composition: row.composition,
    tags: row.tags ?? [],
    sizes: row.sizes ?? {},
    oldPriceRub: row.old_price_rub ?? null,
    flowerCount: row.flower_count ?? null,
    heightCm: row.height_cm ?? null,
    widthCm: row.width_cm ?? null,
    colorPalette: row.color_palette ?? [],
    occasion: row.occasion ?? "",
    imageUrl: row.image_url,
    galleryImages: row.gallery_images ?? [],
    images: row.images ?? [],
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    seoH1: row.seo_h1,
    seoSlug: row.seo_slug,
    seoImageAlt: row.seo_image_alt,
    seoKeywords: row.seo_keywords ?? [],
    seoFaq: row.seo_faq ?? [],
    openGraphTitle: row.open_graph_title,
    openGraphDescription: row.open_graph_description,
    schemaProductJsonLd: row.schema_product_json_ld ?? {},
    isFeatured: row.is_featured,
    isNew: row.is_new,
    isBestseller: row.is_bestseller,
    isPromotion: row.is_promotion ?? false,
    catalogNumber: row.catalog_number,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function postgresListCatalogProducts(): Promise<StoredCatalogProduct[]> {
  const sql = getSqlClient();
  if (!sql) {
    return [];
  }

  await ensureSchema();
  const rows = await sql<CatalogRow[]>`
    WITH published_with_number AS (
      SELECT 
        *,
        LPAD(ROW_NUMBER() OVER (ORDER BY created_at ASC)::TEXT, 3, '0') as row_number
      FROM catalog_products
      WHERE status = 'published'
    )
    SELECT 
      id,
      slug,
      title,
      category,
      status,
      short_description,
      full_description,
      composition,
      tags,
      sizes,
      old_price_rub,
      flower_count,
      height_cm,
      width_cm,
      color_palette,
      occasion,
      image_url,
      gallery_images,
      images,
      seo_title,
      seo_description,
      seo_h1,
      seo_slug,
      seo_image_alt,
      seo_keywords,
      seo_faq,
      open_graph_title,
      open_graph_description,
      schema_product_json_ld,
      is_featured,
      is_new,
      is_bestseller,
      is_promotion,
      created_at,
      updated_at,
      CONCAT('BF-', row_number) as catalog_number
    FROM published_with_number
    ORDER BY created_at ASC
  `;
  return rows.map(rowToProduct);
}

export async function postgresGetCatalogProductById(
  id: string,
): Promise<StoredCatalogProduct | null> {
  const sql = getSqlClient();
  if (!sql) {
    return null;
  }

  await ensureSchema();
  const rows = await sql<CatalogRow[]>`
    WITH published_with_number AS (
      SELECT 
        *,
        LPAD(ROW_NUMBER() OVER (ORDER BY created_at ASC)::TEXT, 3, '0') as row_number
      FROM catalog_products
      WHERE status = 'published'
    )
    SELECT 
      p.id,
      p.slug,
      p.title,
      p.category,
      p.status,
      p.short_description,
      p.full_description,
      p.composition,
      p.tags,
      p.sizes,
      p.old_price_rub,
      p.flower_count,
      p.height_cm,
      p.width_cm,
      p.color_palette,
      p.occasion,
      p.image_url,
      p.gallery_images,
      p.images,
      p.seo_title,
      p.seo_description,
      p.seo_h1,
      p.seo_slug,
      p.seo_image_alt,
      p.seo_keywords,
      p.seo_faq,
      p.open_graph_title,
      p.open_graph_description,
      p.schema_product_json_ld,
      p.is_featured,
      p.is_new,
      p.is_bestseller,
      p.is_promotion,
      p.created_at,
      p.updated_at,
      CASE 
        WHEN p.status = 'published' THEN CONCAT('BF-', LPAD(ROW_NUMBER() OVER (ORDER BY p.created_at ASC)::TEXT, 3, '0'))
        ELSE ''
      END as catalog_number
    FROM catalog_products p
    WHERE p.id = ${id}
    LIMIT 1
  `;
  return rows[0] ? rowToProduct(rows[0]) : null;
}

export async function postgresGetCatalogProductBySlug(
  slug: string,
): Promise<StoredCatalogProduct | null> {
  const sql = getSqlClient();
  if (!sql) {
    return null;
  }

  await ensureSchema();
  const rows = await sql<CatalogRow[]>`
    SELECT 
      p.id,
      p.slug,
      p.title,
      p.category,
      p.status,
      p.short_description,
      p.full_description,
      p.composition,
      p.tags,
      p.sizes,
      p.old_price_rub,
      p.flower_count,
      p.height_cm,
      p.width_cm,
      p.color_palette,
      p.occasion,
      p.image_url,
      p.gallery_images,
      p.images,
      p.seo_title,
      p.seo_description,
      p.seo_h1,
      p.seo_slug,
      p.seo_image_alt,
      p.seo_keywords,
      p.seo_faq,
      p.open_graph_title,
      p.open_graph_description,
      p.schema_product_json_ld,
      p.is_featured,
      p.is_new,
      p.is_bestseller,
      p.is_promotion,
      p.created_at,
      p.updated_at,
      CASE 
        WHEN p.status = 'published' THEN CONCAT('BF-', LPAD((SELECT COUNT(*)::TEXT FROM catalog_products WHERE status = 'published' AND created_at <= p.created_at), 3, '0'))
        ELSE ''
      END as catalog_number
    FROM catalog_products p
    WHERE p.slug = ${slug} OR p.seo_slug = ${slug}
    LIMIT 1
  `;
  return rows[0] ? rowToProduct(rows[0]) : null;
}

export async function postgresUpsertCatalogProduct(
  product: StoredCatalogProduct,
): Promise<StoredCatalogProduct> {
  const sql = getSqlClient();
  if (!sql) {
    throw new Error("Database not configured");
  }

  await ensureSchema();
  const rows = await sql<CatalogRow[]>`
    INSERT INTO catalog_products (
      id, slug, title, category, status, short_description, full_description,
      composition, tags, sizes, old_price_rub, flower_count, height_cm, width_cm,
      color_palette, occasion, image_url, gallery_images, images,
      seo_title, seo_description, seo_h1, seo_slug, seo_image_alt, seo_keywords,
      seo_faq, open_graph_title, open_graph_description, schema_product_json_ld,
      is_featured, is_new, is_bestseller, is_promotion, created_at, updated_at
    ) VALUES (
      ${product.id}, ${product.slug}, ${product.title}, ${product.category},
      ${product.status}, ${product.shortDescription}, ${product.fullDescription},
      ${product.composition}, ${JSON.stringify(product.tags)}, ${JSON.stringify(product.sizes)},
      ${product.oldPriceRub}, ${product.flowerCount}, ${product.heightCm}, ${product.widthCm},
      ${JSON.stringify(product.colorPalette)}, ${product.occasion}, ${product.imageUrl},
      ${JSON.stringify(product.galleryImages)}, ${JSON.stringify(product.images)},
      ${product.seoTitle}, ${product.seoDescription}, ${product.seoH1}, ${product.seoSlug},
      ${product.seoImageAlt}, ${JSON.stringify(product.seoKeywords)}, ${JSON.stringify(product.seoFaq)},
      ${product.openGraphTitle}, ${product.openGraphDescription}, ${JSON.stringify(product.schemaProductJsonLd)},
      ${product.isFeatured}, ${product.isNew}, ${product.isBestseller}, ${product.isPromotion},
      NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      slug = EXCLUDED.slug,
      title = EXCLUDED.title,
      category = EXCLUDED.category,
      status = EXCLUDED.status,
      short_description = EXCLUDED.short_description,
      full_description = EXCLUDED.full_description,
      composition = EXCLUDED.composition,
      tags = EXCLUDED.tags,
      sizes = EXCLUDED.sizes,
      old_price_rub = EXCLUDED.old_price_rub,
      flower_count = EXCLUDED.flower_count,
      height_cm = EXCLUDED.height_cm,
      width_cm = EXCLUDED.width_cm,
      color_palette = EXCLUDED.color_palette,
      occasion = EXCLUDED.occasion,
      image_url = EXCLUDED.image_url,
      gallery_images = EXCLUDED.gallery_images,
      images = EXCLUDED.images,
      seo_title = EXCLUDED.seo_title,
      seo_description = EXCLUDED.seo_description,
      seo_h1 = EXCLUDED.seo_h1,
      seo_slug = EXCLUDED.seo_slug,
      seo_image_alt = EXCLUDED.seo_image_alt,
      seo_keywords = EXCLUDED.seo_keywords,
      seo_faq = EXCLUDED.seo_faq,
      open_graph_title = EXCLUDED.open_graph_title,
      open_graph_description = EXCLUDED.open_graph_description,
      schema_product_json_ld = EXCLUDED.schema_product_json_ld,
      is_featured = EXCLUDED.is_featured,
      is_new = EXCLUDED.is_new,
      is_bestseller = EXCLUDED.is_bestseller,
      is_promotion = EXCLUDED.is_promotion,
      updated_at = NOW()
    RETURNING *
  `;
  if (!rows[0]) throw new Error("Failed to upsert product");
  return rowToProduct(rows[0]);
}

export async function postgresSetCatalogProductStatus(
  id: string,
  status: StoredCatalogProduct["status"],
): Promise<StoredCatalogProduct | null> {
  const sql = getSqlClient();
  if (!sql) {
    return null;
  }

  await ensureSchema();
  const rows = await sql<CatalogRow[]>`
    UPDATE catalog_products
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *,
    CASE 
      WHEN status = 'published' THEN CONCAT('BF-', LPAD((SELECT COUNT(*)::TEXT FROM catalog_products WHERE status = 'published' AND created_at <= catalog_products.created_at), 3, '0'))
      ELSE ''
    END as catalog_number
  `;
  return rows[0] ? rowToProduct(rows[0]) : null;
}
export async function postgresDeleteCatalogProduct(
  id: string,
): Promise<StoredCatalogProduct | null> {
  const sql = getSqlClient();
  if (!sql) {
    return null;
  }

  await ensureSchema();
  
  // First, retrieve the product to delete
  const existing = await postgresGetCatalogProductById(id);
  if (!existing) {
    return null;
  }

  // Then delete it
  await sql`DELETE FROM catalog_products WHERE id = ${id}`;
  
  return existing;
}
