#!/usr/bin/env node
/**
 * Local, read-only preflight / dry-run for the bulk catalog fill.
 *
 * Makes ZERO network calls (no login, no GET/POST to bellaflore.ru).
 * Only reads local files: the full photo manifest, the "remaining"
 * (prepared) manifest, and the photo files themselves — to verify hashes,
 * real content type, size, and to simulate title/slug/price assignment
 * exactly the way the production script will.
 *
 * Run: node scripts/bulk-catalog-preflight.mjs
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  slugify,
  priceAt,
  NAMES,
  TEST_TITLES,
  sniffImageFormat,
  mimeForFormat,
} from "./bulk-catalog-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const FULL_MANIFEST = "/tmp/bf_photo_manifest.json";
const PREPARED_MANIFEST = "/tmp/bf_remaining_photos.fixed.json";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // matches app/api/admin/products/upload-image limit

// --- Bridge-only path shim -------------------------------------------------
// On the user's actual Mac, entry.path (e.g. "/Users/bigsky/Desktop/...")
// resolves directly. This script can also be exercised from inside the
// Claude device-bridge sandbox, where those folders are mounted under
// $HOME/mnt/<folder> instead. This helper tries the real path first and
// only falls back to the mounted mirror if that fails — it is a no-op on
// a normal macOS run.
function resolveReadPath(p) {
  if (fs.existsSync(p)) return p;
  const home = process.env.HOME || "";
  const maps = [
    ["/Users/bigsky/Desktop", `${home}/mnt/Desktop`],
    ["/Users/bigsky/Downloads", `${home}/mnt/Downloads`],
    ["/tmp", `${home}/mnt/tmp`],
  ];
  for (const [real, mnt] of maps) {
    if (p.startsWith(real)) {
      const mapped = mnt + p.slice(real.length);
      if (fs.existsSync(mapped)) return mapped;
    }
  }
  return p;
}

function loadJson(p, fallback = null) {
  const resolved = resolveReadPath(p);
  if (!fs.existsSync(resolved)) return fallback;
  return JSON.parse(fs.readFileSync(resolved, "utf8"));
}

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function main() {
  const report = { generatedAt: new Date().toISOString(), issues: [] };

  // ---- 1. Full source list: total files, unique hashes, exact duplicates
  const full = loadJson(FULL_MANIFEST, []);
  const hashCounts = new Map();
  for (const e of full) hashCounts.set(e.hash, (hashCounts.get(e.hash) || 0) + 1);
  const uniqueHashCount = hashCounts.size;
  const exactDuplicateCount = full.length - uniqueHashCount;
  const duplicateGroups = [...hashCounts.entries()]
    .filter(([, c]) => c > 1)
    .map(([hash, count]) => ({ hash, count, files: full.filter((e) => e.hash === hash).map((e) => e.name) }));

  report.totalFiles = full.length;
  report.uniqueFiles = uniqueHashCount;
  report.exactDuplicates = Math.max(0, exactDuplicateCount);
  report.duplicateGroups = duplicateGroups;

  // ---- 2. Prepared (remaining) manifest: per-entry validation
  const prepared = loadJson(PREPARED_MANIFEST, []);
  report.prepared = prepared.length;

  const validated = prepared.map((entry, idx) => {
    const problems = [];
    const resolved = resolveReadPath(entry.path);

    if (!entry.path || !entry.hash || !entry.name) {
      problems.push("missing required manifest field (path/hash/name)");
      return { entry, idx, valid: false, problems };
    }

    if (!fs.existsSync(resolved)) {
      problems.push("file not found on disk");
      return { entry, idx, valid: false, problems };
    }

    const buf = fs.readFileSync(resolved);

    if (buf.length === 0) {
      problems.push("file is empty (0 bytes)");
    }

    const actualHash = sha256(buf);
    if (actualHash !== entry.hash) {
      problems.push(`hash mismatch: manifest=${entry.hash} actual=${actualHash}`);
    }

    const fmt = sniffImageFormat(buf);
    const mime = mimeForFormat(fmt);
    if (!mime) {
      problems.push(`unrecognized/unsupported image content (magic-byte sniff: ${fmt})`);
    } else if (fmt === "heic") {
      problems.push("real content is HEIC — must be converted before upload, server MIME map accepts it but most browsers cannot render it");
    }

    if (buf.length > MAX_IMAGE_BYTES) {
      problems.push(`file exceeds upload limit: ${buf.length} bytes > ${MAX_IMAGE_BYTES} bytes`);
    }

    return {
      entry,
      idx,
      valid: problems.length === 0,
      problems,
      detectedFormat: fmt,
      detectedMime: mime,
      bytes: buf.length,
    };
  });

  report.valid = validated.filter((v) => v.valid).length;
  report.invalid = validated.filter((v) => !v.valid).length;
  report.invalidDetails = validated
    .filter((v) => !v.valid)
    .map((v) => ({ name: v.entry.name, path: v.entry.path, problems: v.problems }));

  // ---- 3. Simulate title/slug/price assignment (same logic as the
  // production script) to surface slug/title collisions ahead of time.
  const usedTitles = new Set(); // local-batch only; does NOT include live Production titles (no network call made)
  const usedSlugs = new Set();
  let nameIdx = 0;
  let createdCount = 0;
  const plan = [];
  const titleDuplicates = [];
  const slugRawCollisions = [];

  for (const v of validated) {
    if (createdCount >= 75) break;
    const [title, defaultCat, shortDesc] = NAMES[nameIdx % NAMES.length];
    nameIdx++;

    if (TEST_TITLES.has(title.toLowerCase())) {
      plan.push({ name: v.entry.name, skipped: "test-title" });
      continue;
    }
    if (usedTitles.has(title.toLowerCase())) {
      titleDuplicates.push(title);
      plan.push({ name: v.entry.name, skipped: "duplicate-title-in-batch" });
      continue;
    }
    usedTitles.add(title.toLowerCase());

    let slug = slugify(title);
    if (usedSlugs.has(slug)) slugRawCollisions.push(slug);
    let suffix = 2;
    while (usedSlugs.has(slug)) slug = `${slugify(title)}-${suffix++}`;
    usedSlugs.add(slug);

    const price = priceAt(createdCount);
    if (!(price > 0)) {
      report.issues.push(`non-positive price computed for "${title}": ${price}`);
    }

    plan.push({
      name: v.entry.name,
      title,
      slug,
      price,
      category: defaultCat,
      valid: v.valid,
      problems: v.problems,
    });

    if (v.valid) createdCount++;
  }

  report.simulatedCreatable = createdCount;
  report.slugDuplicates = slugRawCollisions.length;
  report.titleDuplicates = titleDuplicates.length;

  // NOTE: "already in Production" (existing titles/slugs on the live site)
  // is intentionally NOT checked here. Computing it requires an
  // authenticated GET to /api/admin/products, which requires a POST to
  // /api/admin/login first — and this preflight makes zero network calls
  // to bellaflore.ru per the "local/read-only, no writes" constraint.
  report.alreadyInProductionChecked = false;
  report.alreadyInProduction = null;

  fs.writeFileSync(
    path.join(ROOT, "scripts", "bulk-catalog-preflight-report.json"),
    JSON.stringify(report, null, 2),
  );

  console.log(JSON.stringify(
    {
      totalFiles: report.totalFiles,
      uniqueFiles: report.uniqueFiles,
      exactDuplicates: report.exactDuplicates,
      prepared: report.prepared,
      valid: report.valid,
      invalid: report.invalid,
      slugDuplicates: report.slugDuplicates,
      titleDuplicates: report.titleDuplicates,
      simulatedCreatable: report.simulatedCreatable,
      alreadyInProductionChecked: report.alreadyInProductionChecked,
    },
    null,
    2,
  ));
}

main();
