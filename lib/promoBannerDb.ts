// ==================================================
// SECTION: Promo banner — real persistence (Postgres + file fallback)
// РАЗДЕЛ: Умный промо-баннер (между Hero и каталогом) — реальное хранение
//
// This is a SEPARATE system from lib/heroBannerDb.ts. The Hero (top of the
// homepage) keeps using hero_banner_settings and is not touched here. This
// module powers a second, independent promotional banner that renders
// between the Hero and the catalog grid, either from admin-authored manual
// slides or auto-generated from live catalog products.
// ==================================================
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";
import { getDatabaseUrl } from "@/lib/catalogDb/config";

export type PromoBannerMode = "manual" | "auto";

export type PromoBannerAutoSource =
  | "featured"
  | "popular"
  | "new"
  | "bestsellers"
  | "admin_selected";

export type PromoBannerSettings = {
  mode: PromoBannerMode;
  autoSource: PromoBannerAutoSource;
  autoSelectedProductIds: string[];
  autoSlideLimit: number;
  updatedAt: string;
};

export type PromoBannerSlide = {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  priority: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_SETTINGS: PromoBannerSettings = {
  mode: "manual",
  autoSource: "featured",
  autoSelectedProductIds: [],
  autoSlideLimit: 8,
  updatedAt: new Date(0).toISOString(),
};

const VALID_MODES: PromoBannerMode[] = ["manual", "auto"];
const VALID_SOURCES: PromoBannerAutoSource[] = [
  "featured",
  "popular",
  "new",
  "bestsellers",
  "admin_selected",
];

type SettingsRow = {
  mode: string;
  auto_source: string;
  auto_selected_product_ids: string;
  auto_slide_limit: number;
  updated_at: string | Date;
};

type SlideRow = {
  id: string;
  image_url: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  priority: number;
  is_enabled: boolean;
  created_at: string | Date;
  updated_at: string | Date;
};

const DATA_DIR = join(process.cwd(), ".data");
const SETTINGS_FILE = join(DATA_DIR, "promo-banner-settings.json");
const SLIDES_FILE = join(DATA_DIR, "promo-banner-slides.json");

let sqlClient: ReturnType<typeof postgres> | null = null;
let schemaReady: Promise<void> | null = null;

function getSqlClient() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    return null;
  }
  if (!sqlClient) {
    sqlClient = postgres(databaseUrl, { max: 2 });
  }
  return sqlClient;
}

async function ensureSchema(): Promise<void> {
  const sql = getSqlClient();
  if (!sql) {
    return;
  }
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS promo_banner_settings (
          id TEXT PRIMARY KEY DEFAULT 'default',
          mode TEXT NOT NULL DEFAULT 'manual',
          auto_source TEXT NOT NULL DEFAULT 'featured',
          auto_selected_product_ids TEXT NOT NULL DEFAULT '[]',
          auto_slide_limit INT NOT NULL DEFAULT 8,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS promo_banner_slides (
          id TEXT PRIMARY KEY,
          image_url TEXT NOT NULL DEFAULT '',
          title TEXT NOT NULL DEFAULT '',
          subtitle TEXT NOT NULL DEFAULT '',
          button_text TEXT NOT NULL DEFAULT '',
          button_link TEXT NOT NULL DEFAULT '',
          priority INT NOT NULL DEFAULT 0,
          is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
    })();
  }
  await schemaReady;
}

function sanitizeMode(value: unknown): PromoBannerMode {
  return typeof value === "string" && VALID_MODES.includes(value as PromoBannerMode)
    ? (value as PromoBannerMode)
    : "manual";
}

function sanitizeSource(value: unknown): PromoBannerAutoSource {
  return typeof value === "string" &&
    VALID_SOURCES.includes(value as PromoBannerAutoSource)
    ? (value as PromoBannerAutoSource)
    : "featured";
}

function parseProductIds(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function settingsRowToSettings(row: SettingsRow): PromoBannerSettings {
  return {
    mode: sanitizeMode(row.mode),
    autoSource: sanitizeSource(row.auto_source),
    autoSelectedProductIds: parseProductIds(row.auto_selected_product_ids),
    autoSlideLimit:
      Number.isFinite(row.auto_slide_limit) && row.auto_slide_limit > 0
        ? row.auto_slide_limit
        : 8,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function slideRowToSlide(row: SlideRow): PromoBannerSlide {
  return {
    id: row.id,
    imageUrl: row.image_url,
    title: row.title,
    subtitle: row.subtitle,
    buttonText: row.button_text,
    buttonLink: row.button_link,
    priority: row.priority,
    isEnabled: row.is_enabled,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function readJsonFile<T>(path: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(path, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

async function writeJsonFile<T>(path: string, value: T): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2), "utf8");
}

// ---------------------------------------------------
// Settings (singleton row)
// ---------------------------------------------------

export async function getPromoBannerSettings(): Promise<PromoBannerSettings> {
  const sql = getSqlClient();
  if (!sql) {
    return readJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);
  }

  await ensureSchema();
  const rows = await sql<SettingsRow[]>`
    SELECT * FROM promo_banner_settings WHERE id = 'default' LIMIT 1
  `;
  return rows[0] ? settingsRowToSettings(rows[0]) : DEFAULT_SETTINGS;
}

export type PromoBannerSettingsUpdateInput = Partial<
  Omit<PromoBannerSettings, "updatedAt">
>;

export async function updatePromoBannerSettings(
  patch: PromoBannerSettingsUpdateInput,
): Promise<PromoBannerSettings> {
  const current = await getPromoBannerSettings();
  const next: PromoBannerSettings = {
    mode: patch.mode ? sanitizeMode(patch.mode) : current.mode,
    autoSource: patch.autoSource ? sanitizeSource(patch.autoSource) : current.autoSource,
    autoSelectedProductIds: patch.autoSelectedProductIds ?? current.autoSelectedProductIds,
    autoSlideLimit: patch.autoSlideLimit ?? current.autoSlideLimit,
    updatedAt: new Date().toISOString(),
  };

  const sql = getSqlClient();
  if (!sql) {
    await writeJsonFile(SETTINGS_FILE, next);
    return next;
  }

  await ensureSchema();
  const rows = await sql<SettingsRow[]>`
    INSERT INTO promo_banner_settings (id, mode, auto_source, auto_selected_product_ids, auto_slide_limit, updated_at)
    VALUES ('default', ${next.mode}, ${next.autoSource}, ${JSON.stringify(next.autoSelectedProductIds)}, ${next.autoSlideLimit}, ${next.updatedAt})
    ON CONFLICT (id) DO UPDATE SET
      mode = EXCLUDED.mode,
      auto_source = EXCLUDED.auto_source,
      auto_selected_product_ids = EXCLUDED.auto_selected_product_ids,
      auto_slide_limit = EXCLUDED.auto_slide_limit,
      updated_at = EXCLUDED.updated_at
    RETURNING *
  `;
  return rows[0] ? settingsRowToSettings(rows[0]) : next;
}

// ---------------------------------------------------
// Slides (manual mode)
// ---------------------------------------------------

export async function listPromoBannerSlides(): Promise<PromoBannerSlide[]> {
  const sql = getSqlClient();
  if (!sql) {
    const slides = await readJsonFile<PromoBannerSlide[]>(SLIDES_FILE, []);
    return [...slides].sort((left, right) => left.priority - right.priority);
  }

  await ensureSchema();
  const rows = await sql<SlideRow[]>`
    SELECT * FROM promo_banner_slides ORDER BY priority ASC, created_at ASC
  `;
  return rows.map(slideRowToSlide);
}

export type PromoBannerSlideInput = {
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  isEnabled?: boolean;
};

export async function createPromoBannerSlide(
  input: PromoBannerSlideInput,
): Promise<PromoBannerSlide> {
  const existing = await listPromoBannerSlides();
  const maxPriority = existing.reduce((max, slide) => Math.max(max, slide.priority), -1);
  const now = new Date().toISOString();
  const slide: PromoBannerSlide = {
    id: randomUUID(),
    imageUrl: (input.imageUrl ?? "").trim(),
    title: (input.title ?? "").trim(),
    subtitle: (input.subtitle ?? "").trim(),
    buttonText: (input.buttonText ?? "").trim(),
    buttonLink: (input.buttonLink ?? "").trim(),
    priority: maxPriority + 1,
    isEnabled: input.isEnabled ?? true,
    createdAt: now,
    updatedAt: now,
  };

  const sql = getSqlClient();
  if (!sql) {
    await writeJsonFile(SLIDES_FILE, [...existing, slide]);
    return slide;
  }

  await ensureSchema();
  await sql`
    INSERT INTO promo_banner_slides (id, image_url, title, subtitle, button_text, button_link, priority, is_enabled, created_at, updated_at)
    VALUES (${slide.id}, ${slide.imageUrl}, ${slide.title}, ${slide.subtitle}, ${slide.buttonText}, ${slide.buttonLink}, ${slide.priority}, ${slide.isEnabled}, ${slide.createdAt}, ${slide.updatedAt})
  `;
  return slide;
}

export class PromoBannerSlideNotFoundError extends Error {
  constructor() {
    super("Слайд баннера не найден.");
    this.name = "PromoBannerSlideNotFoundError";
  }
}

export type PromoBannerSlideUpdateInput = Partial<
  Omit<PromoBannerSlide, "id" | "createdAt" | "updatedAt" | "priority">
>;

export async function updatePromoBannerSlide(
  id: string,
  patch: PromoBannerSlideUpdateInput,
): Promise<PromoBannerSlide> {
  const sql = getSqlClient();
  const now = new Date().toISOString();

  if (!sql) {
    const slides = await readJsonFile<PromoBannerSlide[]>(SLIDES_FILE, []);
    const index = slides.findIndex((slide) => slide.id === id);
    if (index === -1) {
      throw new PromoBannerSlideNotFoundError();
    }
    const updated: PromoBannerSlide = { ...slides[index], ...patch, updatedAt: now };
    slides[index] = updated;
    await writeJsonFile(SLIDES_FILE, slides);
    return updated;
  }

  await ensureSchema();
  const current = await sql<SlideRow[]>`
    SELECT * FROM promo_banner_slides WHERE id = ${id} LIMIT 1
  `;
  if (!current[0]) {
    throw new PromoBannerSlideNotFoundError();
  }
  const merged = { ...slideRowToSlide(current[0]), ...patch, updatedAt: now };
  await sql`
    UPDATE promo_banner_slides SET
      image_url = ${merged.imageUrl},
      title = ${merged.title},
      subtitle = ${merged.subtitle},
      button_text = ${merged.buttonText},
      button_link = ${merged.buttonLink},
      is_enabled = ${merged.isEnabled},
      updated_at = ${merged.updatedAt}
    WHERE id = ${id}
  `;
  return merged;
}

export async function deletePromoBannerSlide(id: string): Promise<void> {
  const sql = getSqlClient();
  if (!sql) {
    const slides = await readJsonFile<PromoBannerSlide[]>(SLIDES_FILE, []);
    await writeJsonFile(
      SLIDES_FILE,
      slides.filter((slide) => slide.id !== id),
    );
    return;
  }

  await ensureSchema();
  await sql`DELETE FROM promo_banner_slides WHERE id = ${id}`;
}

/**
 * Persists a full ordered list of slide ids as the new priority order
 * (index in the array becomes the new priority). Ids not present in the
 * current slide set are ignored; slides not present in `orderedIds` keep
 * their relative order appended at the end.
 */
export async function reorderPromoBannerSlides(
  orderedIds: string[],
): Promise<PromoBannerSlide[]> {
  const current = await listPromoBannerSlides();
  const currentIds = new Set(current.map((slide) => slide.id));
  const validOrderedIds = orderedIds.filter((id) => currentIds.has(id));
  const remaining = current
    .map((slide) => slide.id)
    .filter((id) => !validOrderedIds.includes(id));
  const finalOrder = [...validOrderedIds, ...remaining];
  const now = new Date().toISOString();

  const sql = getSqlClient();
  if (!sql) {
    const byId = new Map(current.map((slide) => [slide.id, slide]));
    const reordered = finalOrder.map((id, index) => ({
      ...byId.get(id)!,
      priority: index,
      updatedAt: now,
    }));
    await writeJsonFile(SLIDES_FILE, reordered);
    return reordered;
  }

  await ensureSchema();
  await Promise.all(
    finalOrder.map((id, index) =>
      sql`UPDATE promo_banner_slides SET priority = ${index}, updated_at = ${now} WHERE id = ${id}`,
    ),
  );
  return listPromoBannerSlides();
}
