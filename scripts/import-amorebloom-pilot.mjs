/**
 * Idempotent pilot import of the 20 reviewed AmoreBloom products.
 *
 * Reads DATABASE_URL and BLOB_READ_WRITE_TOKEN from the environment.
 * Does not print either value. Re-runs skip rows that already match.
 * Deletes only the confirmed extra draft of «Персиковый бархат».
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { list, put } from "@vercel/blob";
import postgres from "postgres";

const PILOT_JSON =
  process.env.PILOT_JSON ||
  "/cursor/stores/self/docs/amorebloom-bellaflore-pilot-20.json";
const PHOTO_DIR =
  process.env.PHOTO_DIR ||
  "/cursor/stores/self/media/amorebloom-pilot-photos";
const REPORT_PATH =
  process.env.PILOT_REPORT ||
  "/cursor/stores/self/docs/amorebloom-pilot-import-result.json";
const DRY_RUN = process.env.DRY_RUN === "1";
const MISSING_COMPOSITION = "Состав в источнике не указан.";
const CONFIRMED_DUPLICATE_ID = "admin-product-1789986687235-ka3wof";
const ORIGINAL_ID = "admin-product-1789464225936-55xs6l";
const CATEGORY_IDS = {
  Розы: "roses",
  Пионы: "peonies",
  Гортензии: "hydrangeas",
  Корзины: "baskets",
  Композиции: "compositions",
  Авторские: "author",
};
const CYRILLIC_TO_LATIN = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
  щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function scrub(error) {
  return String(error?.message || error)
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]")
    .replace(/vercel_blob_rw_\S+/g, "[redacted]");
}

function slugify(value) {
  const transliterated = [...value.trim().toLowerCase()]
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join("");
  return transliterated
    .replace(/[^a-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function compositionText(value) {
  if (Array.isArray(value)) {
    return value.map((line) => String(line).trim()).filter(Boolean).join("\n");
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return "";
}

function pilotId(sourceId) {
  return `pilot-ab-${sourceId}`;
}

function assertWebp(bytes, label) {
  const head = bytes.subarray(0, 12).toString("ascii");
  if (!head.startsWith("RIFF") || !head.includes("WEBP")) {
    throw new Error(`Photo is not a webp file: ${label}`);
  }
}

async function loadPilot() {
  const dataset = JSON.parse(await readFile(PILOT_JSON, "utf8"));
  const manifest = JSON.parse(await readFile(path.join(PHOTO_DIR, "manifest.json"), "utf8"));
  if (!Array.isArray(dataset.products) || dataset.products.length !== 20) {
    throw new Error(`Expected 20 pilot products, found ${dataset.products?.length ?? 0}`);
  }

  const products = dataset.products.map((row) => {
    const sourceId = String(row.source?.id || "").trim();
    const name = String(row.bellaflore?.name || "").trim();
    const categoryTitle = String(row.bellaflore?.category || "").trim();
    const categoryId = CATEGORY_IDS[categoryTitle];
    const priceRub = row.bellaflore?.priceRub;
    const photos = [
      row.bellaflore?.primaryPhoto,
      ...(row.bellaflore?.additionalPhotos || []),
    ].filter(Boolean);
    if (!sourceId || !name || !categoryId) {
      throw new Error(`Pilot row is missing id, name, or category: ${row.proposedBfNumber}`);
    }
    if (!Number.isInteger(priceRub) || priceRub <= 0 || priceRub !== row.source?.priceRub) {
      throw new Error(`Price mismatch for ${name}`);
    }
    if (row.source?.isActive === false) {
      throw new Error(`Inactive source product included: ${name}`);
    }
    if (photos.length === 0) {
      throw new Error(`No photos for ${name}`);
    }

    const missing = Boolean(row.bellaflore?.compositionMissing);
    const text = compositionText(row.bellaflore?.composition);
    const sourceComposition = compositionText(row.source?.composition);
    const sourceDescription = String(row.source?.description || "");
    if (missing) {
      if (text) {
        throw new Error(`Missing composition row still has composition text: ${name}`);
      }
    } else if (!text) {
      throw new Error(`Composition text missing for ${name}`);
    } else {
      const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
      const haystack = `${sourceComposition}\n${sourceDescription}`;
      for (const line of lines) {
        if (!haystack.includes(line)) {
          throw new Error(`Composition line is not in the source for ${name}`);
        }
      }
    }

    const localPhotos = photos.map((url) => {
      const filename = manifest[url];
      if (!filename) {
        throw new Error(`No cached photo for ${name}`);
      }
      return { sourceUrl: url, filename, absolutePath: path.join(PHOTO_DIR, filename) };
    });

    return {
      id: pilotId(sourceId),
      sourceId,
      proposedNumber: String(row.proposedBfNumber),
      name,
      slug: slugify(name),
      categoryId,
      categoryTitle,
      priceRub,
      missing,
      composition: missing ? "" : text,
      shortDescription: missing ? MISSING_COMPOSITION : text,
      fullDescription: sourceDescription.trim() || (missing ? MISSING_COMPOSITION : text),
      localPhotos,
    };
  });

  const unique = (values, label) => {
    if (new Set(values).size !== values.length) {
      throw new Error(`Duplicate ${label} inside the pilot`);
    }
  };
  unique(products.map((product) => product.id), "ids");
  unique(products.map((product) => product.slug), "slugs");
  unique(products.map((product) => product.proposedNumber), "numbers");
  unique(products.map((product) => product.name), "names");
  return products;
}

async function readPhotos(products) {
  for (const product of products) {
    for (const photo of product.localPhotos) {
      const bytes = await readFile(photo.absolutePath);
      assertWebp(bytes, photo.filename);
      if (bytes.length < 1000) {
        throw new Error(`Photo is too small: ${photo.filename}`);
      }
      photo.bytes = bytes;
    }
  }
}

async function uploadPhotos(products) {
  const existing = new Map();
  let cursor;
  do {
    const page = await list({ prefix: "catalog/products/pilot-ab/", cursor, limit: 1000 });
    for (const blob of page.blobs) {
      existing.set(blob.pathname, blob.url);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  let uploaded = 0;
  let reused = 0;
  for (const product of products) {
    product.imageUrls = [];
    for (let index = 0; index < product.localPhotos.length; index += 1) {
      const photo = product.localPhotos[index];
      const pathname = `catalog/products/pilot-ab/${product.sourceId}/${String(index + 1).padStart(2, "0")}.webp`;
      let url = existing.get(pathname);
      if (!url) {
        const blob = await put(pathname, photo.bytes, {
          access: "public",
          contentType: "image/webp",
          addRandomSuffix: false,
          allowOverwrite: false,
        });
        url = blob.url;
        uploaded += 1;
      } else {
        reused += 1;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Uploaded photo is not reachable (${response.status}) for ${product.name}`);
      }
      const remote = Buffer.from(await response.arrayBuffer());
      assertWebp(remote, pathname);
      if (remote.length !== photo.bytes.length) {
        throw new Error(`Uploaded photo size differs for ${product.name}`);
      }
      product.imageUrls.push(url);
    }
  }
  return { uploaded, reused };
}

function imageDrafts(product, now) {
  return product.imageUrls.map((url, index) => ({
    id: `${product.id}-image-${index + 1}`,
    size: product.localPhotos[index].bytes.length,
    width: 1080,
    height: 1350,
    filename: `${product.slug}-${index + 1}.webp`,
    mimeType: "image/webp",
    createdAt: now,
    isPrimary: index === 0,
    sortOrder: index,
    updatedAt: now,
    originalUrl: url,
    processedUrl: url,
    thumbnailUrl: url,
    processingError: null,
    processingStatus: "original",
  }));
}

async function findOrderReferences(sql, productId) {
  const tables = await sql`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('orders', 'order_items', 'order_drafts')
      AND data_type IN ('text', 'json', 'jsonb', 'character varying')
  `;
  const hits = [];
  for (const column of tables) {
    const rows = await sql.unsafe(
      `SELECT 1 FROM ${column.table_name} WHERE ${column.column_name}::text LIKE $1 LIMIT 1`,
      [`%${productId}%`],
    );
    if (rows.length > 0) {
      hits.push(`${column.table_name}.${column.column_name}`);
    }
  }
  return hits;
}

function assignNumbers(products, occupiedByOthers) {
  const used = new Set(occupiedByOthers);
  const assignments = [];
  let nextFree = 276;
  for (const product of products) {
    const preferred = product.proposedNumber;
    let catalogNumber = preferred;
    let reason = "proposed";
    if (used.has(preferred)) {
      while (used.has(`BF-${String(nextFree).padStart(3, "0")}`)) {
        nextFree += 1;
      }
      catalogNumber = `BF-${String(nextFree).padStart(3, "0")}`;
      nextFree += 1;
      reason = `${preferred} is already used by a product that is not a confirmed duplicate`;
    }
    used.add(catalogNumber);
    assignments.push({ ...product, catalogNumber, reason });
  }
  return assignments;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!DRY_RUN && !process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  }

  const products = await loadPilot();
  await readPhotos(products);
  const sql = postgres(process.env.DATABASE_URL, {
    ssl: "require",
    max: 1,
    connect_timeout: 20,
  });

  try {
    const duplicateRefs = await findOrderReferences(sql, CONFIRMED_DUPLICATE_ID);
    if (duplicateRefs.length > 0) {
      throw new Error(`Confirmed duplicate is linked to orders: ${duplicateRefs.join(", ")}`);
    }

    const duplicate = await sql`
      SELECT id, catalog_number, status, title, image_url, composition, sizes
      FROM catalog_products
      WHERE id = ${CONFIRMED_DUPLICATE_ID}
    `;
    const original = await sql`
      SELECT id, catalog_number, status, title, image_url, composition, sizes
      FROM catalog_products
      WHERE id = ${ORIGINAL_ID}
    `;
    if (original.length !== 1 || original[0].catalog_number !== "BF-255" || original[0].status !== "published") {
      throw new Error("Original Персиковый бархат was not found");
    }
    let deletedDuplicate = false;
    if (duplicate.length === 1) {
      const copy = duplicate[0];
      const confirmed =
        copy.catalog_number === "BF-257" &&
        copy.status === "draft" &&
        copy.title === "Персиковый бархат — копия" &&
        copy.image_url === original[0].image_url &&
        copy.composition === original[0].composition &&
        JSON.stringify(copy.sizes) === JSON.stringify(original[0].sizes);
      if (!confirmed) {
        throw new Error("BF-257 draft no longer matches the confirmed duplicate");
      }
    }

    const rows = await sql`
      SELECT id, slug, title, catalog_number, status, sizes
      FROM catalog_products
    `;
    const byId = new Map(rows.map((row) => [row.id, row]));
    const bySlug = new Map(rows.map((row) => [row.slug, row]));
    const byNumber = new Map(rows.map((row) => [row.catalog_number, row]));

    const blockedNumbers = new Set(
      rows
        .filter((row) => !String(row.id).startsWith("pilot-ab-"))
        .map((row) => row.catalog_number),
    );
    if (duplicate.length === 1) {
      blockedNumbers.delete("BF-257");
    }
    const assigned = assignNumbers(products, blockedNumbers);

    const plan = [];
    for (const product of assigned) {
      const sameId = byId.get(product.id);
      const sameSlug = bySlug.get(product.slug);
      const sameNumber = byNumber.get(product.catalogNumber);
      if (sameSlug && sameSlug.id !== product.id) {
        throw new Error(`Slug ${product.slug} already belongs to ${sameSlug.catalog_number}`);
      }
      if (sameNumber && sameNumber.id !== product.id && sameNumber.id !== CONFIRMED_DUPLICATE_ID) {
        throw new Error(`${product.catalogNumber} already belongs to ${sameNumber.title}`);
      }
      if (sameId) {
        const price = sameId.sizes?.S;
        if (
          sameId.slug !== product.slug ||
          sameId.title !== product.name ||
          sameId.catalog_number !== product.catalogNumber ||
          price !== product.priceRub
        ) {
          throw new Error(`Existing pilot row ${product.id} does not match the dataset`);
        }
        plan.push({ ...product, action: "skip" });
      } else {
        plan.push({ ...product, action: "insert" });
      }
    }

    const summary = {
      dryRun: DRY_RUN,
      deletedDuplicate: false,
      products: plan.map((product) => ({
        catalogNumber: product.catalogNumber,
        name: product.name,
        slug: product.slug,
        priceRub: product.priceRub,
        action: product.action,
        reason: product.reason,
        photos: product.localPhotos.length,
      })),
    };

    if (DRY_RUN) {
      console.log(JSON.stringify(summary, null, 2));
      return;
    }

    const photoStats = await uploadPhotos(plan);
    const now = new Date().toISOString();
    await sql.begin(async (tx) => {
      if (duplicate.length === 1) {
        const removed = await tx`
          DELETE FROM catalog_products
          WHERE id = ${CONFIRMED_DUPLICATE_ID}
            AND catalog_number = 'BF-257'
            AND status = 'draft'
            AND title = 'Персиковый бархат — копия'
            AND image_url = ${original[0].image_url}
            AND composition = ${original[0].composition}
            AND NOT EXISTS (
              SELECT 1 FROM order_items
              WHERE product_id = ${CONFIRMED_DUPLICATE_ID}
            )
          RETURNING id
        `;
        if (removed.length !== 1) {
          throw new Error("Confirmed duplicate was not deleted");
        }
        deletedDuplicate = true;
      }

      for (const product of plan) {
        if (product.action === "skip") {
          continue;
        }
        const images = imageDrafts(product, now);
        const gallery = images.slice(1).map((image) => image.processedUrl);
        await tx`
          INSERT INTO catalog_products (
            id, slug, title, category, status, short_description, full_description,
            composition, tags, sizes, old_price_rub, flower_count, height_cm, width_cm,
            color_palette, occasion, image_url, gallery_images, images,
            seo_title, seo_description, seo_h1, seo_slug, seo_image_alt, seo_keywords,
            seo_faq, open_graph_title, open_graph_description, schema_product_json_ld,
            is_featured, is_new, is_bestseller, is_promotion, catalog_number, created_at, updated_at
          ) VALUES (
            ${product.id}, ${product.slug}, ${product.name}, ${product.categoryId},
            'published', ${product.shortDescription}, ${product.fullDescription},
            ${product.composition}, ${tx.json([product.categoryTitle])}, ${tx.json({ S: product.priceRub })},
            ${null}, ${null}, ${null}, ${null},
            ${tx.json([])}, ${""}, ${images[0].processedUrl}, ${tx.json(gallery)}, ${tx.json(images)},
            ${product.name}, ${product.shortDescription.slice(0, 180)}, ${product.name}, ${product.slug},
            ${product.name}, ${tx.json([product.categoryTitle])},
            ${tx.json([])}, ${product.name}, ${product.shortDescription.slice(0, 180)}, ${tx.json({})},
            ${false}, ${false}, ${false}, ${false}, ${product.catalogNumber}, NOW(), NOW()
          )
        `;
      }

      await tx`
        SELECT setval(
          'catalog_product_number_seq',
          GREATEST(
            COALESCE((
              SELECT MAX((SUBSTRING(catalog_number FROM '^BF-([0-9]+)$'))::BIGINT)
              FROM catalog_products
              WHERE catalog_number ~ '^BF-[0-9]+$'
            ), 0),
            1
          ),
          TRUE
        )
      `;
    });

    const saved = await sql`
      SELECT catalog_number, title, slug, status, sizes, image_url
      FROM catalog_products
      WHERE id LIKE 'pilot-ab-%'
      ORDER BY catalog_number
    `;
    summary.deletedDuplicate = deletedDuplicate;
    summary.photoStats = photoStats;
    summary.savedCount = saved.length;
    summary.saved = saved.map((row) => ({
      catalogNumber: row.catalog_number,
      title: row.title,
      slug: row.slug,
      status: row.status,
      priceRub: row.sizes?.S,
      imageHost: new URL(row.image_url).host,
    }));
    await writeFile(REPORT_PATH, JSON.stringify(summary, null, 2));
    console.log(JSON.stringify({
      deletedDuplicate,
      savedCount: saved.length,
      uploaded: photoStats.uploaded,
      reused: photoStats.reused,
      numbers: saved.map((row) => row.catalog_number),
    }, null, 2));
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(scrub(error));
  process.exit(1);
});
