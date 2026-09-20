import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";
import { getDatabaseUrl } from "@/lib/catalogDb/config";
import type {
  VisualStory,
  VisualStoriesSettings,
  VisualStoryDestinationType,
} from "@/lib/visualStoriesTypes";

const DEFAULT_STORIES: VisualStory[] = [
  {
    id: "story-royal-collection",
    imageUrl: "/piony 11.PNG",
    eyebrow: "Композиции",
    title: "Royal Collection",
    destinationType: "product",
    destinationValue: "royal-collection",
    isEnabled: true,
    sortOrder: 0,
  },
  {
    id: "story-pink-elegance",
    imageUrl: "/0002.jpg",
    eyebrow: "Авторские",
    title: "Pink Elegance",
    destinationType: "product",
    destinationValue: "pink-elegance",
    isEnabled: true,
    sortOrder: 1,
  },
  {
    id: "story-white-pearl",
    imageUrl: "/white rose 101.PNG",
    eyebrow: "Розы",
    title: "White Pearl",
    destinationType: "product",
    destinationValue: "white-pearl",
    isEnabled: true,
    sortOrder: 2,
  },
  {
    id: "story-luxury-box",
    imageUrl: "/mix piony siren.PNG",
    eyebrow: "Коробки",
    title: "Luxury Box",
    destinationType: "product",
    destinationValue: "luxury-box",
    isEnabled: true,
    sortOrder: 3,
  },
  {
    id: "story-red-luxury",
    imageUrl: "/roza rouze royal.PNG",
    eyebrow: "Розы",
    title: "Red Luxury",
    destinationType: "product",
    destinationValue: "red-luxury",
    isEnabled: true,
    sortOrder: 4,
  },
];

const DEFAULT_SETTINGS: VisualStoriesSettings = {
  stories: DEFAULT_STORIES,
  updatedAt: new Date(0).toISOString(),
};

type VisualStoriesRow = {
  stories_json: unknown;
  updated_at: string | Date;
};

const DATA_DIR = join(process.cwd(), ".data");
const DATA_FILE = join(DATA_DIR, "visual-stories.json");

let sqlClient: ReturnType<typeof postgres> | null = null;
let schemaReady: Promise<void> | null = null;

function getSqlClient() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) return null;
  if (!sqlClient) sqlClient = postgres(databaseUrl, { max: 2 });
  return sqlClient;
}

async function ensureSchema(): Promise<void> {
  const sql = getSqlClient();
  if (!sql) return;

  if (!schemaReady) {
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS visual_stories_settings (
        id TEXT PRIMARY KEY DEFAULT 'default',
        stories_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `.then(() => undefined);
  }

  await schemaReady;
}

function normalizeDestinationType(value: unknown): VisualStoryDestinationType {
  return value === "product" ||
    value === "category" ||
    value === "catalog" ||
    value === "url"
    ? value
    : "catalog";
}

function normalizeStories(value: unknown): VisualStory[] {
  if (!Array.isArray(value)) return DEFAULT_STORIES;

  const stories = value
    .map((entry, index): VisualStory | null => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as Partial<VisualStory>;
      const imageUrl =
        typeof candidate.imageUrl === "string" ? candidate.imageUrl.trim() : "";
      if (!imageUrl) return null;

      return {
        id:
          typeof candidate.id === "string" && candidate.id.trim()
            ? candidate.id.trim()
            : `visual-story-${index}`,
        imageUrl,
        eyebrow:
          typeof candidate.eyebrow === "string"
            ? candidate.eyebrow.trim().slice(0, 80)
            : "",
        title:
          typeof candidate.title === "string"
            ? candidate.title.trim().slice(0, 120)
            : "",
        destinationType: normalizeDestinationType(candidate.destinationType),
        destinationValue:
          typeof candidate.destinationValue === "string"
            ? candidate.destinationValue.trim().slice(0, 500)
            : "",
        isEnabled:
          typeof candidate.isEnabled === "boolean" ? candidate.isEnabled : true,
        sortOrder: Number.isFinite(candidate.sortOrder)
          ? Number(candidate.sortOrder)
          : index,
      };
    })
    .filter((story): story is VisualStory => Boolean(story))
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .slice(0, 5)
    .map((story, index) => ({ ...story, sortOrder: index }));

  return stories.length > 0 ? stories : DEFAULT_STORIES;
}

function normalizeSettings(value: Partial<VisualStoriesSettings>): VisualStoriesSettings {
  return {
    stories: normalizeStories(value.stories),
    updatedAt:
      typeof value.updatedAt === "string" && value.updatedAt
        ? value.updatedAt
        : new Date().toISOString(),
  };
}

async function readFileSettings(): Promise<VisualStoriesSettings> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    return normalizeSettings(JSON.parse(raw) as Partial<VisualStoriesSettings>);
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), "utf8");
    return DEFAULT_SETTINGS;
  }
}

async function writeFileSettings(settings: VisualStoriesSettings) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(settings, null, 2), "utf8");
}

export async function getVisualStoriesSettings(): Promise<VisualStoriesSettings> {
  const sql = getSqlClient();
  if (!sql) return readFileSettings();

  await ensureSchema();
  const rows = await sql<VisualStoriesRow[]>`
    SELECT stories_json, updated_at
    FROM visual_stories_settings
    WHERE id = 'default'
    LIMIT 1
  `;

  if (!rows[0]) return DEFAULT_SETTINGS;

  return normalizeSettings({
    stories: normalizeStories(rows[0].stories_json),
    updatedAt: new Date(rows[0].updated_at).toISOString(),
  });
}

export async function updateVisualStoriesSettings(
  stories: VisualStory[],
): Promise<VisualStoriesSettings> {
  const next = normalizeSettings({
    stories,
    updatedAt: new Date().toISOString(),
  });

  const sql = getSqlClient();
  if (!sql) {
    await writeFileSettings(next);
    return next;
  }

  await ensureSchema();
  const rows = await sql<VisualStoriesRow[]>`
    INSERT INTO visual_stories_settings (id, stories_json, updated_at)
    VALUES ('default', ${sql.json(next.stories)}, ${next.updatedAt})
    ON CONFLICT (id) DO UPDATE SET
      stories_json = EXCLUDED.stories_json,
      updated_at = EXCLUDED.updated_at
    RETURNING stories_json, updated_at
  `;

  return rows[0]
    ? normalizeSettings({
        stories: normalizeStories(rows[0].stories_json),
        updatedAt: new Date(rows[0].updated_at).toISOString(),
      })
    : next;
}
