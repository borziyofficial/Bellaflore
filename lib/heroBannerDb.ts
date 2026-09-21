// ==================================================
// SECTION: Hero banner — real persistence (Postgres + file fallback)
// РАЗДЕЛ: Умный баннер главной страницы — реальное хранение
// ==================================================
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";
import { getDatabaseUrl } from "@/lib/catalogDb/config";

export type HeroBannerSettings = {
  imageUrl: string;
  photos: HeroBannerPhoto[];
  title: string;
  subtitle: string;
  eyebrow: string;
  buttonText: string;
  buttonLink: string;
  cardTitle: string;
  cardSubtitle: string;
  tagline: string;
  isEnabled: boolean;
  updatedAt: string;
};

export type HeroBannerPhoto = {
  id: string;
  imageUrl: string;
  mobileImageUrl: string;
  objectPosition: string;
  isEnabled: boolean;
  isPrimary: boolean;
  sortOrder: number;
};

const DEFAULT_SETTINGS: HeroBannerSettings = {
  imageUrl: "",
  photos: [],
  title: "",
  subtitle: "",
  eyebrow: "",
  buttonText: "",
  buttonLink: "",
  cardTitle: "",
  cardSubtitle: "",
  tagline: "",
  isEnabled: false,
  updatedAt: new Date(0).toISOString(),
};

type HeroBannerRow = {
  image_url: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  button_text: string;
  button_link: string;
  card_title: string;
  card_subtitle: string;
  tagline: string;
  is_enabled: boolean;
  photos_json?: unknown;
  updated_at: string | Date;
};

const DATA_DIR = join(process.cwd(), ".data");
const DATA_FILE = join(DATA_DIR, "hero-banner.json");

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
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS hero_banner_settings (
        id TEXT PRIMARY KEY DEFAULT 'default',
        image_url TEXT NOT NULL DEFAULT '',
        photos_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        title TEXT NOT NULL DEFAULT '',
        subtitle TEXT NOT NULL DEFAULT '',
        button_text TEXT NOT NULL DEFAULT '',
        button_link TEXT NOT NULL DEFAULT '',
        is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
      .then(() => sql`
        ALTER TABLE hero_banner_settings
        ADD COLUMN IF NOT EXISTS photos_json JSONB NOT NULL DEFAULT '[]'::jsonb
      `)
      .then(() => sql`
        ALTER TABLE hero_banner_settings
        ADD COLUMN IF NOT EXISTS eyebrow TEXT NOT NULL DEFAULT ''
      `)
      .then(() => sql`
        ALTER TABLE hero_banner_settings
        ADD COLUMN IF NOT EXISTS card_title TEXT NOT NULL DEFAULT ''
      `)
      .then(() => sql`
        ALTER TABLE hero_banner_settings
        ADD COLUMN IF NOT EXISTS card_subtitle TEXT NOT NULL DEFAULT ''
      `)
      .then(() => sql`
        ALTER TABLE hero_banner_settings
        ADD COLUMN IF NOT EXISTS tagline TEXT NOT NULL DEFAULT ''
      `)
      .then(() => undefined);
  }
  await schemaReady;
}

function createLegacyPhoto(imageUrl: string): HeroBannerPhoto {
  return {
    id: "legacy-primary",
    imageUrl,
    mobileImageUrl: "",
    objectPosition: "50% 50%",
    isEnabled: true,
    isPrimary: true,
    sortOrder: 0,
  };
}

function normalizeHeroPhotos(
  photos: unknown,
  legacyImageUrl = "",
): HeroBannerPhoto[] {
  const normalized = Array.isArray(photos)
    ? photos
        .map((photo, index): HeroBannerPhoto | null => {
          if (!photo || typeof photo !== "object") {
            return null;
          }

          const candidate = photo as Partial<HeroBannerPhoto>;
          const imageUrl = typeof candidate.imageUrl === "string" ? candidate.imageUrl.trim() : "";
          if (!imageUrl) {
            return null;
          }

          return {
            id:
              typeof candidate.id === "string" && candidate.id.trim()
                ? candidate.id.trim()
                : `hero-photo-${index}`,
            imageUrl,
            mobileImageUrl:
              typeof candidate.mobileImageUrl === "string" ? candidate.mobileImageUrl.trim() : "",
            objectPosition:
              typeof candidate.objectPosition === "string" && candidate.objectPosition.trim()
                ? candidate.objectPosition.trim()
                : "50% 50%",
            isEnabled: typeof candidate.isEnabled === "boolean" ? candidate.isEnabled : true,
            isPrimary: typeof candidate.isPrimary === "boolean" ? candidate.isPrimary : false,
            sortOrder: Number.isFinite(candidate.sortOrder) ? Number(candidate.sortOrder) : index,
          };
        })
        .filter((photo): photo is HeroBannerPhoto => Boolean(photo))
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((photo, index) => ({ ...photo, sortOrder: index }))
    : [];

  if (normalized.length === 0 && legacyImageUrl.trim()) {
    return [createLegacyPhoto(legacyImageUrl.trim())];
  }

  if (normalized.length === 0) {
    return [];
  }

  const primaryIndex = normalized.findIndex((photo) => photo.isPrimary);
  return normalized.map((photo, index) => ({
    ...photo,
    isPrimary: index === (primaryIndex >= 0 ? primaryIndex : 0),
  }));
}

function normalizeSettings(settings: HeroBannerSettings): HeroBannerSettings {
  const photos = normalizeHeroPhotos(settings.photos, settings.imageUrl);
  const primaryPhoto =
    photos.find((photo) => photo.isPrimary) ??
    photos.find((photo) => photo.isEnabled) ??
    photos[0];

  return {
    ...settings,
    imageUrl: primaryPhoto?.imageUrl ?? settings.imageUrl.trim(),
    photos,
  };
}

function rowToSettings(row: HeroBannerRow): HeroBannerSettings {
  return normalizeSettings({
    imageUrl: row.image_url,
    photos: normalizeHeroPhotos(row.photos_json, row.image_url),
    title: row.title,
    subtitle: row.subtitle,
    eyebrow: row.eyebrow ?? "",
    buttonText: row.button_text,
    buttonLink: row.button_link,
    cardTitle: row.card_title ?? "",
    cardSubtitle: row.card_subtitle ?? "",
    tagline: row.tagline ?? "",
    isEnabled: row.is_enabled,
    updatedAt: new Date(row.updated_at).toISOString(),
  });
}

async function readFileSettings(): Promise<HeroBannerSettings> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<HeroBannerSettings>;
    return normalizeSettings({ ...DEFAULT_SETTINGS, ...parsed });
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), "utf8");
    return DEFAULT_SETTINGS;
  }
}

async function writeFileSettings(settings: HeroBannerSettings): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(normalizeSettings(settings), null, 2), "utf8");
}

export async function getHeroBannerSettings(): Promise<HeroBannerSettings> {
  const sql = getSqlClient();
  if (!sql) {
    return readFileSettings();
  }

  await ensureSchema();
  const rows = await sql<HeroBannerRow[]>`
    SELECT * FROM hero_banner_settings WHERE id = 'default' LIMIT 1
  `;
  return rows[0] ? rowToSettings(rows[0]) : DEFAULT_SETTINGS;
}

export type HeroBannerUpdateInput = Partial<
  Omit<HeroBannerSettings, "updatedAt">
>;

export async function updateHeroBannerSettings(
  patch: HeroBannerUpdateInput,
): Promise<HeroBannerSettings> {
  const current = await getHeroBannerSettings();
  const next = normalizeSettings({
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  });

  const sql = getSqlClient();
  if (!sql) {
    await writeFileSettings(next);
    return next;
  }

  await ensureSchema();
  const rows = await sql<HeroBannerRow[]>`
    INSERT INTO hero_banner_settings (id, image_url, photos_json, title, subtitle, eyebrow, button_text, button_link, card_title, card_subtitle, tagline, is_enabled, updated_at)
    VALUES ('default', ${next.imageUrl}, ${sql.json(next.photos)}, ${next.title}, ${next.subtitle}, ${next.eyebrow}, ${next.buttonText}, ${next.buttonLink}, ${next.cardTitle}, ${next.cardSubtitle}, ${next.tagline}, ${next.isEnabled}, ${next.updatedAt})
    ON CONFLICT (id) DO UPDATE SET
      image_url = EXCLUDED.image_url,
      photos_json = EXCLUDED.photos_json,
      title = EXCLUDED.title,
      subtitle = EXCLUDED.subtitle,
      eyebrow = EXCLUDED.eyebrow,
      button_text = EXCLUDED.button_text,
      button_link = EXCLUDED.button_link,
      card_title = EXCLUDED.card_title,
      card_subtitle = EXCLUDED.card_subtitle,
      tagline = EXCLUDED.tagline,
      is_enabled = EXCLUDED.is_enabled,
      updated_at = EXCLUDED.updated_at
    RETURNING *
  `;
  return rows[0] ? rowToSettings(rows[0]) : next;
}
