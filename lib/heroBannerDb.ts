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
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  isEnabled: boolean;
  updatedAt: string;
};

const DEFAULT_SETTINGS: HeroBannerSettings = {
  imageUrl: "",
  title: "",
  subtitle: "",
  buttonText: "",
  buttonLink: "",
  isEnabled: false,
  updatedAt: new Date(0).toISOString(),
};

type HeroBannerRow = {
  image_url: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  is_enabled: boolean;
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
        title TEXT NOT NULL DEFAULT '',
        subtitle TEXT NOT NULL DEFAULT '',
        button_text TEXT NOT NULL DEFAULT '',
        button_link TEXT NOT NULL DEFAULT '',
        is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `.then(() => undefined);
  }
  await schemaReady;
}

function rowToSettings(row: HeroBannerRow): HeroBannerSettings {
  return {
    imageUrl: row.image_url,
    title: row.title,
    subtitle: row.subtitle,
    buttonText: row.button_text,
    buttonLink: row.button_link,
    isEnabled: row.is_enabled,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function readFileSettings(): Promise<HeroBannerSettings> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<HeroBannerSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), "utf8");
    return DEFAULT_SETTINGS;
  }
}

async function writeFileSettings(settings: HeroBannerSettings): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(settings, null, 2), "utf8");
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
  const next: HeroBannerSettings = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  const sql = getSqlClient();
  if (!sql) {
    await writeFileSettings(next);
    return next;
  }

  await ensureSchema();
  const rows = await sql<HeroBannerRow[]>`
    INSERT INTO hero_banner_settings (id, image_url, title, subtitle, button_text, button_link, is_enabled, updated_at)
    VALUES ('default', ${next.imageUrl}, ${next.title}, ${next.subtitle}, ${next.buttonText}, ${next.buttonLink}, ${next.isEnabled}, ${next.updatedAt})
    ON CONFLICT (id) DO UPDATE SET
      image_url = EXCLUDED.image_url,
      title = EXCLUDED.title,
      subtitle = EXCLUDED.subtitle,
      button_text = EXCLUDED.button_text,
      button_link = EXCLUDED.button_link,
      is_enabled = EXCLUDED.is_enabled,
      updated_at = EXCLUDED.updated_at
    RETURNING *
  `;
  return rows[0] ? rowToSettings(rows[0]) : next;
}
