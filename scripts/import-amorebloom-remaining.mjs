/**
 * Idempotent import of the remaining active AmoreBloom products.
 *
 * Reads DATABASE_URL and BLOB_READ_WRITE_TOKEN from the environment.
 * Does not print either value. Re-runs skip rows that already match.
 * Does not rewrite existing BellaFlore ids, prices, articles, or orders.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { list, put } from "@vercel/blob";
import postgres from "postgres";

const API = "https://api.amorebloom.ru/v1/products";
const PHOTO_DIR =
  process.env.PHOTO_DIR ||
  "/cursor/stores/self/media/amorebloom-remaining-photos";
const REPORT_PATH =
  process.env.IMPORT_REPORT ||
  "/cursor/stores/self/docs/amorebloom-remaining-import-result.json";
const DRY_RUN = process.env.DRY_RUN === "1";
const BATCH_SIZE = Number(process.env.BATCH_SIZE || 10);
const MISSING_COMPOSITION = "Состав в источнике не указан.";
const CATEGORY_IDS = {
  Розы: "roses",
  "Пионовидные розы": "roses",
  "Кустовые розы": "roses",
  Гортензия: "hydrangeas",
  Гортензии: "hydrangeas",
  Пионы: "peonies",
  "Корзина цветов": "baskets",
  Корзины: "baskets",
  Композиции: "compositions",
  "Цвети для вазы": "compositions",
  "Цветы для вазы": "compositions",
  Сирень: "author",
  Маттиола: "author",
  "Гвоздика Dianthus": "author",
  Тюльпаны: "author",
  Монобукеты: "author",
  Хризантемы: "author",
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function limitConcurrency(limit) {
  let active = 0;
  const queue = [];
  const pump = () => {
    if (active >= limit || queue.length === 0) {
      return;
    }
    active += 1;
    const job = queue.shift();
    job.fn().then(job.resolve, job.reject).finally(() => {
      active -= 1;
      pump();
    });
  };
  return (fn) =>
    new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      pump();
    });
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

function cleanTitle(name) {
  return String(name || "")
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Modifier}\uFE0F\u200D]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function rublesFromKopecks(value, label) {
  if (!Number.isInteger(value) || value <= 0 || value % 100 !== 0) {
    throw new Error(`Missing or invalid price for ${label}`);
  }
  return value / 100;
}

function extractComposition(description) {
  const text = String(description || "").replace(/\r\n/g, "\n");
  const match = text.match(
    /(?:^|\n)\s*(?:🌸\s*)?Состав(?:\s+букета|\s+композиции)?\s*:?\s*\n([\s\S]*)$/i,
  );
  if (!match) {
    return "";
  }
  return match[1].trim();
}

function productId(sourceId) {
  return `ab-${sourceId}`;
}

function assertWebp(bytes, label) {
  const head = bytes.subarray(0, 12).toString("ascii");
  if (!head.startsWith("RIFF") || !head.includes("WEBP")) {
    throw new Error(`Photo is not a webp file: ${label}`);
  }
}

async function fetchPage(page) {
  const url = `${API}?limit=5&page=${page}`;
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) {
        throw new Error(`Catalog page ${page} returned HTTP ${response.status}`);
      }
      const body = await response.json();
      if (!Array.isArray(body.data) || !body.meta) {
        throw new Error(`Catalog page ${page} has an unexpected shape`);
      }
      return body;
    } catch (error) {
      lastError = error;
      await sleep(400 * attempt);
    }
  }
  throw lastError;
}

async function loadSource() {
  const first = await fetchPage(1);
  const total = first.meta.total;
  const pages = first.meta.totalPages;
  const rows = [...first.data];
  for (let page = 2; page <= pages; page += 1) {
    const next = await fetchPage(page);
    rows.push(...next.data);
    await sleep(120);
  }
  if (rows.length !== total) {
    throw new Error(`Source returned ${rows.length} products, meta.total is ${total}`);
  }
  const ids = new Set(rows.map((row) => row.id));
  if (ids.size !== rows.length) {
    throw new Error("Source catalog contains repeated ids");
  }
  return rows;
}

function normalize(row) {
  const sourceId = String(row.id || "").trim();
  const title = cleanTitle(row.name);
  const categoryTitle = String(row.category?.name || "").trim();
  const categoryId = CATEGORY_IDS[categoryTitle] || "author";
  const description = String(row.description || "").trim();
  const composition = extractComposition(description);
  const images = (row.images || []).filter((url) => typeof url === "string" && url.startsWith("https://"));
  const priceRub = rublesFromKopecks(row.price, title || sourceId);
  const oldPriceRub =
    Number.isInteger(row.oldPrice) && row.oldPrice > 0 && row.oldPrice % 100 === 0
      ? row.oldPrice / 100
      : null;
  return {
    sourceId,
    id: productId(sourceId),
    title,
    sourceName: String(row.name || ""),
    slugBase: slugify(title || row.slug || sourceId),
    categoryId,
    categoryTitle,
    categoryMapped: Boolean(CATEGORY_IDS[categoryTitle]),
    priceRub,
    oldPriceRub,
    composition,
    compositionMissing: composition.length === 0,
    description,
    images,
    isActive: row.isActive !== false,
    inStock: row.inStock !== false,
  };
}

async function fetchRange(url, start, end) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Range: `bytes=${start}-${end}` },
        signal: AbortSignal.timeout(15000),
      });
      if (response.status === 429) {
        await sleep(1500 * attempt);
        continue;
      }
      if (response.status !== 206 && response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      const total = Number((response.headers.get("content-range") || "").split("/")[1]) || null;
      return { bytes, total, status: response.status };
    } catch (error) {
      lastError = error;
      await sleep(300 * attempt);
    }
  }
  throw lastError;
}

async function downloadWebp(url) {
  const filename = path.basename(new URL(url).pathname);
  const destination = path.join(PHOTO_DIR, filename);
  try {
    const cached = await readFile(destination);
    assertWebp(cached, filename);
    if (cached.length > 1000) {
      return { filename, bytes: cached, downloaded: false };
    }
  } catch {
    // A missing or incomplete cache file is downloaded again.
  }

  const first = await fetchRange(url, 0, 7999);
  if (first.status === 200 && first.bytes.length > 1000) {
    assertWebp(first.bytes, filename);
    await writeFile(destination, first.bytes);
    return { filename, bytes: first.bytes, downloaded: true };
  }
  if (!first.total || first.bytes.length !== 8000) {
    throw new Error(`Photo download stalled for ${filename}`);
  }
  const chunks = [first.bytes];
  for (let start = 8000; start < first.total; start += 8000) {
    const end = Math.min(start + 7999, first.total - 1);
    const part = await fetchRange(url, start, end);
    if (part.bytes.length !== end - start + 1) {
      throw new Error(`Short photo chunk for ${filename}`);
    }
    chunks.push(part.bytes);
    await sleep(40);
  }
  const bytes = Buffer.concat(chunks);
  if (bytes.length !== first.total) {
    throw new Error(`Photo length mismatch for ${filename}`);
  }
  assertWebp(bytes, filename);
  await writeFile(destination, bytes);
  return { filename, bytes, downloaded: true };
}

async function uploadPhotos(products) {
  const existing = new Map();
  let cursor;
  do {
    const page = await list({ prefix: "catalog/products/ab/", cursor, limit: 1000 });
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
      const pathname = `catalog/products/ab/${product.sourceId}/${String(index + 1).padStart(2, "0")}.webp`;
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
        throw new Error(`Stored photo is not reachable (${response.status}) for ${product.title}`);
      }
      const remote = Buffer.from(await response.arrayBuffer());
      assertWebp(remote, pathname);
      if (remote.length !== photo.bytes.length) {
        throw new Error(`Stored photo size differs for ${product.title}`);
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

function assignIdentity(products, rows) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const usedSlugs = new Set(rows.map((row) => row.slug));
  const usedNumbers = new Set(rows.map((row) => row.catalog_number));
  let nextNumber = 0;
  for (const number of usedNumbers) {
    const match = String(number || "").match(/^BF-(\d+)$/);
    if (match) {
      nextNumber = Math.max(nextNumber, Number(match[1]));
    }
  }
  nextNumber += 1;

  return products.map((product) => {
    const existing = byId.get(product.id) || byId.get(`pilot-ab-${product.sourceId}`);
    if (existing) {
      return { ...product, existing, action: "skip" };
    }
    let slug = product.slugBase;
    if (!slug || usedSlugs.has(slug)) {
      slug = `${product.slugBase || "buket"}-${product.sourceId.slice(-4)}`;
    }
    while (usedSlugs.has(slug)) {
      slug = `${slug}-${product.sourceId.slice(-2)}`;
    }
    usedSlugs.add(slug);
    while (usedNumbers.has(`BF-${String(nextNumber).padStart(3, "0")}`)) {
      nextNumber += 1;
    }
    const catalogNumber = `BF-${String(nextNumber).padStart(3, "0")}`;
    usedNumbers.add(catalogNumber);
    nextNumber += 1;
    return { ...product, slug, catalogNumber, action: "insert" };
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!DRY_RUN && !process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  }

  const source = await loadSource();
  const normalized = [];
  const blocked = [];
  for (const row of source) {
    try {
      normalized.push(normalize(row));
    } catch (error) {
      blocked.push({ sourceId: row.id, title: cleanTitle(row.name), reason: scrub(error) });
    }
  }
  const inactive = normalized.filter((product) => !product.isActive);
  const active = normalized.filter((product) => product.isActive);
  const seenImages = new Map();
  const skippedSourceDuplicates = [];
  const uniqueActive = [];
  for (const product of [...active].sort((left, right) => left.sourceId.localeCompare(right.sourceId))) {
    const fingerprint = `${product.priceRub}|${product.composition}|${[...product.images].sort().join("|")}`;
    const prior = seenImages.get(fingerprint);
    if (prior && product.images.length > 0) {
      skippedSourceDuplicates.push({
        sourceId: product.sourceId,
        title: product.title,
        sameAs: prior.sourceId,
        priceRub: product.priceRub,
      });
      continue;
    }
    seenImages.set(fingerprint, product);
    uniqueActive.push(product);
  }

  await mkdir(PHOTO_DIR, { recursive: true });
  const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1, connect_timeout: 20 });
  const missingComposition = [];
  try {
    const rows = await sql`
      SELECT id, slug, title, catalog_number, status, sizes, image_url
      FROM catalog_products
    `;
    const planned = assignIdentity(uniqueActive, rows);
    for (const product of planned) {
      const keepsSourceGap = product.action === "insert" || String(product.existing?.id || "").startsWith("ab-");
      if (product.compositionMissing && keepsSourceGap) {
        missingComposition.push({ sourceId: product.sourceId, title: product.title, catalogNumber: product.catalogNumber });
      }
      if (!product.categoryMapped) {
        product.categoryNote = product.categoryTitle || "empty";
      }
      if (!product.title || !product.slugBase) {
        blocked.push({ sourceId: product.sourceId, reason: "empty title" });
        product.action = "blocked";
      }
      if (product.images.length === 0) {
        blocked.push({ sourceId: product.sourceId, title: product.title, reason: "no photos" });
        product.action = "blocked";
      }
    }

    const summary = {
      sourceTotal: source.length,
      sourceActive: active.length,
      inactive: inactive.map((product) => ({ sourceId: product.sourceId, title: product.title })),
      alreadyImported: planned.filter((product) => product.action === "skip").length,
      toInsert: planned.filter((product) => product.action === "insert").length,
      blocked: blocked.length,
      missingComposition: missingComposition.length,
      skippedSourceDuplicates,
    };
    console.log("PLAN", JSON.stringify(summary));
    if (DRY_RUN) {
      console.log(JSON.stringify(planned.map((product) => ({
        action: product.action,
        catalogNumber: product.catalogNumber,
        title: product.title,
        slug: product.slug || product.existing?.slug,
        priceRub: product.priceRub,
        photos: product.images.length,
        compositionMissing: product.compositionMissing,
      })), null, 2));
      return;
    }

    let uploaded = 0;
    let reused = 0;
    let inserted = 0;
    const ready = [];
    const photoQueue = limitConcurrency(4);
    const pending = planned.filter((product) => product.action === "insert");
    await Promise.all(pending.map((product) => photoQueue(async () => {
      try {
        const photos = [];
        for (const url of product.images) {
          const photo = await downloadWebp(url);
          photos.push({ ...photo, sourceUrl: url });
        }
        product.localPhotos = photos;
        ready.push(product);
        console.log("PHOTO", product.catalogNumber, product.localPhotos.length, product.title);
      } catch (error) {
        blocked.push({ sourceId: product.sourceId, title: product.title, reason: scrub(error) });
        console.log("BLOCKED", product.catalogNumber, product.title, scrub(error));
      }
    })));
    ready.sort((left, right) => left.catalogNumber.localeCompare(right.catalogNumber, undefined, { numeric: true }));

    for (let offset = 0; offset < ready.length; offset += BATCH_SIZE) {
      const batch = ready.slice(offset, offset + BATCH_SIZE);
      const photoStats = await uploadPhotos(batch);
      uploaded += photoStats.uploaded;
      reused += photoStats.reused;
      const now = new Date().toISOString();
      await sql.begin(async (tx) => {
        for (const product of batch) {
          const images = imageDrafts(product, now);
          const gallery = images.slice(1).map((image) => image.processedUrl);
          const shortDescription = product.compositionMissing
            ? MISSING_COMPOSITION
            : product.composition;
          const fullDescription = product.description || shortDescription;
          await tx`
            INSERT INTO catalog_products (
              id, slug, title, category, status, short_description, full_description,
              composition, tags, sizes, old_price_rub, flower_count, height_cm, width_cm,
              color_palette, occasion, image_url, gallery_images, images,
              seo_title, seo_description, seo_h1, seo_slug, seo_image_alt, seo_keywords,
              seo_faq, open_graph_title, open_graph_description, schema_product_json_ld,
              is_featured, is_new, is_bestseller, is_promotion, catalog_number, created_at, updated_at
            ) VALUES (
              ${product.id}, ${product.slug}, ${product.title}, ${product.categoryId},
              'published', ${shortDescription}, ${fullDescription},
              ${product.compositionMissing ? "" : product.composition},
              ${tx.json([product.categoryTitle].filter(Boolean))},
              ${tx.json({ S: product.priceRub })},
              ${product.oldPriceRub}, ${null}, ${null}, ${null},
              ${tx.json([])}, ${""}, ${images[0].processedUrl}, ${tx.json(gallery)}, ${tx.json(images)},
              ${product.title}, ${shortDescription.slice(0, 180)}, ${product.title}, ${product.slug},
              ${product.title}, ${tx.json([product.categoryTitle].filter(Boolean))},
              ${tx.json([])}, ${product.title}, ${shortDescription.slice(0, 180)},
              ${tx.json({ source: "amorebloom", sourceId: product.sourceId })},
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
      inserted += batch.length;
      const check = await sql`
        SELECT count(*)::int AS imported,
               count(DISTINCT catalog_number)::int AS numbers,
               count(*)::int = count(DISTINCT catalog_number) AS unique_numbers
        FROM catalog_products
      `;
      console.log("BATCH", JSON.stringify({
        inserted,
        uploaded,
        reused,
        uniqueNumbers: check[0].unique_numbers,
        catalogRows: check[0].imported,
      }));
    }

    const saved = await sql`
      SELECT id, catalog_number, title, slug, sizes, image_url, composition,
             jsonb_array_length(images) AS photos
      FROM catalog_products
      WHERE id LIKE 'ab-%' OR id LIKE 'pilot-ab-%'
      ORDER BY (substring(catalog_number from '^BF-([0-9]+)$'))::int
    `;
    const report = {
      sourceTotal: source.length,
      sourceActive: active.length,
      inactive: inactive.length,
      alreadyPresent: planned.filter((product) => product.action === "skip").length,
      inserted,
      photosUploaded: uploaded,
      photosReused: reused,
      blocked,
      missingComposition,
      skippedSourceDuplicates,
      importedIds: saved.length,
      uniqueCatalog: true,
    };
    await writeFile(REPORT_PATH, JSON.stringify(report, null, 2));
    console.log("DONE", JSON.stringify({
      sourceTotal: source.length,
      alreadyPresent: report.alreadyPresent,
      inserted,
      photosUploaded: uploaded,
      photosReused: reused,
      blocked: blocked.length,
      missingComposition: missingComposition.length,
      importedIds: saved.length,
    }));
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(scrub(error));
  process.exit(1);
});
