#!/usr/bin/env node
/**
 * One-off production catalog fill — FIXED version.
 * Uses ADMIN_USERNAME/ADMIN_PASSWORD from .env.vercel.local. Does NOT print
 * credentials. Skips errors and continues (one bad item never stops the batch).
 *
 * Fixes applied vs. the original bulk-catalog-fill-production.mjs, based on
 * a code + manifest audit (see scripts/bulk-catalog-preflight-report.json):
 *
 *  1. Stats (photosFound / duplicatesSkipped) are now computed from the
 *     actual manifest and actual skip events instead of hardcoded numbers
 *     (81 / 16) that didn't match the real data (real diff was 6, not 16).
 *  2. Image content-type is now detected from the file's real bytes
 *     (magic-byte sniff), not guessed from the file extension. 5 files in
 *     the manifest were HEIC content (4 with a .HEIC/.heic extension, 1
 *     mislabeled with a .jpg extension) that the old logic would have
 *     uploaded as "image/jpeg" — producing published products with
 *     unrenderable main images in most browsers. This script now refuses
 *     to upload anything that doesn't sniff as jpeg/png/webp/gif, with a
 *     clear per-item error instead of a silent mislabel.
 *  3. Uploads are pre-checked against the server's 5MB limit
 *     (app/api/admin/products/upload-image) before spending a request.
 *  4. This script defaults to the corrected manifest
 *     (/tmp/bf_remaining_photos.fixed.json), which points HEIC-originated
 *     entries at their already-converted JPEG copies
 *     (*.converted.jpg, produced locally, not on Production).
 *
 * Everything else — no delete/update of existing products, per-item
 * try/catch so one failure never stops the batch, no retry loops, no
 * secrets in logs, slug uniqueness against live Production, positive
 * price, upload -> create(+SEO) -> publish order — is unchanged from the
 * audited original.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  slugify,
  priceAt,
  NAMES,
  TEST_TITLES,
  emptyForm,
  detectCategory,
  sniffImageFormat,
  mimeForFormat,
} from "./bulk-catalog-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE = process.env.BF_BASE_URL || "https://bellaflore.vercel.app";
// Default switched to the Vercel alias per explicit instruction: the
// custom domain (bellaflore.ru) is a known-unstable P0 issue being handled
// as a separate task. bellaflore.vercel.app is the same Production
// deployment/project, just reached via its stable Vercel-issued alias
// instead of the flaky custom domain. Override with BF_BASE_URL if needed.
const MANIFEST = process.env.BF_MANIFEST_PATH || "/tmp/bf_remaining_photos.fixed.json";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(path.join(ROOT, ".env.vercel.local"));
loadEnvFile(path.join(ROOT, ".env.local"));

const user = process.env.ADMIN_USERNAME?.trim();
const pass = process.env.ADMIN_PASSWORD?.trim();

async function login() {
  const res = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, password: pass }),
  });
  const body = await res.json();
  if (!res.ok || !body.authenticated) {
    throw new Error(body.message || "Admin login failed");
  }
  const setCookie = res.headers.getSetCookie?.() || [];
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

async function main() {
  if (!user || !pass) {
    console.error("ERROR: ADMIN_USERNAME/ADMIN_PASSWORD not found in .env.vercel.local");
    process.exit(2);
  }

  if (!fs.existsSync(MANIFEST)) {
    console.error(`ERROR: photo manifest missing at ${MANIFEST} — run photo prep first`);
    process.exit(2);
  }

  const remaining = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const cookie = await login();

  const listRes = await fetch(`${BASE}/api/admin/products`, { headers: { Cookie: cookie } });
  const listBody = await listRes.json();
  const existingSlugs = new Set((listBody.products || []).map((p) => p.slug));
  const existingTitles = new Set((listBody.products || []).map((p) => p.title?.toLowerCase()));

  // ETAP 1: read-only dedupe precheck, logged before any write happens.
  process.stderr.write(
    `[precheck] Production currently has ${listBody.products?.length ?? 0} products ` +
    `(${existingSlugs.size} distinct slugs, ${existingTitles.size} distinct titles). ` +
    `Read-only GET only — no writes performed yet.\n`,
  );

  const stats = {
    photosInManifest: remaining.length, // was hardcoded to 81 — now real
    duplicatesSkipped: 0, // was hardcoded to 16 and never incremented — now real
    uploadOk: 0,
    uploadTotal: 0,
    created: 0,
    createdTotal: 0,
    published: 0,
    publishedTotal: 0,
    failed: 0,
    errors: [],
    createdItems: [],
  };

  let nameIdx = 0;
  let createdCount = 0;

  const CREATE_CAP = Number.isFinite(Number(process.env.BF_CREATE_CAP)) ? Number(process.env.BF_CREATE_CAP) : 75;

  for (const photo of remaining) {
    if (createdCount >= CREATE_CAP) break;

    const [title, defaultCat, shortDesc, fullDesc] = NAMES[nameIdx % NAMES.length];
    nameIdx++;
    if (TEST_TITLES.has(title.toLowerCase()) || existingTitles.has(title.toLowerCase())) {
      stats.duplicatesSkipped++;
      continue;
    }

    let slug = slugify(title);
    let suffix = 2;
    while (existingSlugs.has(slug)) slug = `${slugify(title)}-${suffix++}`;

    stats.uploadTotal++;
    let imageUrl;
    let storage;
    try {
      const buf = fs.readFileSync(photo.path);

      if (buf.length === 0) throw new Error("file is empty (0 bytes)");
      if (buf.length > MAX_IMAGE_BYTES) {
        throw new Error(`file exceeds ${MAX_IMAGE_BYTES}-byte upload limit (${buf.length} bytes)`);
      }

      // Real content-based type detection — fixes the original bug where
      // MIME was guessed from the file extension and could silently label
      // HEIC bytes as image/jpeg.
      const fmt = sniffImageFormat(buf);
      const mime = mimeForFormat(fmt);
      if (!mime) {
        throw new Error(`unrecognized image content (sniffed as "${fmt}") — refusing to guess a MIME type`);
      }
      if (fmt === "heic") {
        throw new Error("real content is HEIC — convert to JPEG/WebP locally before running this script");
      }

      const fd = new FormData();
      fd.append("image", new Blob([buf], { type: mime }), path.basename(photo.path));
      const up = await fetch(`${BASE}/api/admin/products/upload-image`, {
        method: "POST",
        headers: { Cookie: cookie },
        body: fd,
      });
      const upBody = await up.json();
      if (!up.ok) throw new Error(upBody.message || "upload failed");
      if (!upBody.imageUrl) throw new Error("upload succeeded but response had no imageUrl");
      imageUrl = upBody.imageUrl;
      storage = upBody.storage;
      stats.uploadOk++;
    } catch (e) {
      stats.failed++;
      stats.errors.push(`${path.basename(photo.path)} upload: ${e.message}`);
      continue;
    }

    const price = priceAt(createdCount);
    if (!(price > 0)) {
      stats.failed++;
      stats.errors.push(`${title}: computed non-positive price (${price}), skipping`);
      continue;
    }

    const form = emptyForm();
    form.title = title;
    form.slug = slug;
    form.categoryId = detectCategory(photo.path, defaultCat);
    form.shortDescription = shortDesc;
    form.fullDescription = fullDesc;
    form.status = "published";
    form.sizePrices.M = String(price);
    form.mainImageUrl = imageUrl;
    form.mainImageAlt = `Букет ${title} — Bellaflore`;
    form.mainImageStorage = storage === "blob" ? "blob" : "server";
    form.seoTitle = `${title} — купить с доставкой | Bellaflore`;
    form.seoDescription = `${shortDesc} Доставка по Москве сегодня. Премиальные букеты Bellaflore.`;
    form.seoH1 = title;
    form.seoSlug = slug;
    form.seoImageAlt = `Букет ${title} — Bellaflore`;
    form.tags = `${title}, bellaflore, букет, доставка цветов`;

    stats.createdTotal++;
    try {
      const cr = await fetch(`${BASE}/api/admin/products`, {
        method: "POST",
        headers: { Cookie: cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ form }),
      });
      const crBody = await cr.json();
      if (!cr.ok) throw new Error(crBody.message || "create failed");
      const product = crBody.product;
      stats.created++;
      existingSlugs.add(slug);
      existingTitles.add(title.toLowerCase());

      // NOTE: the create call above already sends status:"published", and
      // the server (app/api/admin/products/route.ts) publishes it
      // immediately via upsertCatalogProduct({ ...stored, status:
      // "published" }) — confirmed by reading lib/catalogDb/index.ts,
      // where visibility is solely gated by `status === "published"` and
      // there is no separate publishedAt/isPublished flag. So the product
      // is already live at this point; the explicit /publish call below is
      // consequently redundant (idempotent) — kept only so a failure here
      // still surfaces as a warning, not because it is required for
      // visibility, and because it CANNOT leave a "broken" card if it
      // fails: the record already has full title/image/SEO content.
      stats.publishedTotal++;
      const pub = await fetch(`${BASE}/api/admin/products/${encodeURIComponent(product.id)}/publish`, {
        method: "POST",
        headers: { Cookie: cookie },
      });
      const pubBody = await pub.json();
      if (!pub.ok || !pubBody.product?.isPublished) {
        stats.errors.push(`${title} (${product.slug}): redundant /publish call failed (${pubBody.message || pub.status}) — product was already published at creation, no broken record`);
      } else {
        stats.published++;
      }
      stats.createdItems.push({ title, price, id: product.id, slug: product.slug });
      createdCount++;
      process.stderr.write(`OK ${createdCount} ${title} ${price} ${product.slug}\n`);
    } catch (e) {
      stats.failed++;
      stats.errors.push(`${title} (${path.basename(photo.path)}): ${e.message}`);
    }
  }

  console.log(JSON.stringify(stats, null, 2));
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
