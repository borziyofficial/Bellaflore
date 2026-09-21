// ==================================================
// SECTION: Homepage content blocks — real persistence (Postgres + file fallback)
// РАЗДЕЛ: Управляемые блоки главной страницы — реальное хранение
// ==================================================
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";
import { getDatabaseUrl } from "@/lib/catalogDb/config";
import {
  HOMEPAGE_BLOCK_KINDS,
  isHomepageBlockKind,
  type HomepageBlock,
  type HomepageBlockCard,
  type HomepageBlockKind,
} from "@/lib/homepageBlocksTypes";

const DEFAULT_COPY: Record<
  HomepageBlockKind,
  Pick<HomepageBlock, "title" | "subtitle" | "buttonText" | "buttonLink"> & {
    cards: Array<Pick<HomepageBlockCard, "title" | "subtitle" | "buttonText" | "buttonLink">>;
  }
> = {
  featured: {
    title: "Подборка недели",
    subtitle: "Актуальные букеты этого сезона, выбранные нашими флористами",
    buttonText: "",
    buttonLink: "",
    cards: [
      { title: "Нежность", subtitle: "Пастельная композиция", buttonText: "Смотреть", buttonLink: "/catalog" },
      { title: "Характер", subtitle: "Яркий авторский букет", buttonText: "Смотреть", buttonLink: "/catalog" },
      { title: "Классика", subtitle: "Монобукет из роз", buttonText: "Смотреть", buttonLink: "/catalog" },
    ],
  },
  seasonal: {
    title: "К этому дню",
    subtitle: "Готовые решения под особый повод",
    buttonText: "",
    buttonLink: "",
    cards: [
      { title: "День рождения", subtitle: "Яркие композиции", buttonText: "Выбрать", buttonLink: "/catalog" },
      { title: "Свадьба", subtitle: "Нежные тона", buttonText: "Выбрать", buttonLink: "/catalog" },
      { title: "Годовщина", subtitle: "Романтичные букеты", buttonText: "Выбрать", buttonLink: "/catalog" },
    ],
  },
  ctaBand: {
    title: "Готовы удивить?",
    subtitle: "Соберём букет, который запомнится",
    buttonText: "Выбрать букет",
    buttonLink: "/catalog",
    cards: [],
  },
};

function buildDefaultBlock(kind: HomepageBlockKind): HomepageBlock {
  const copy = DEFAULT_COPY[kind];
  return {
    kind,
    isEnabled: true,
    title: copy.title,
    subtitle: copy.subtitle,
    buttonText: copy.buttonText,
    buttonLink: copy.buttonLink,
    cards: copy.cards.map((card, index) => ({
      id: `${kind}-default-${index}`,
      imageUrl: "",
      title: card.title,
      subtitle: card.subtitle,
      buttonText: card.buttonText,
      buttonLink: card.buttonLink,
      isEnabled: true,
      sortOrder: index,
    })),
    updatedAt: new Date(0).toISOString(),
  };
}

const DEFAULT_BLOCKS: Record<HomepageBlockKind, HomepageBlock> = Object.fromEntries(
  HOMEPAGE_BLOCK_KINDS.map((kind) => [kind, buildDefaultBlock(kind)]),
) as Record<HomepageBlockKind, HomepageBlock>;

type HomepageBlockRow = {
  kind: string;
  is_enabled: boolean;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  cards_json: unknown;
  updated_at: string | Date;
};

const DATA_DIR = join(process.cwd(), ".data");
const DATA_FILE = join(DATA_DIR, "homepage-blocks.json");

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
      CREATE TABLE IF NOT EXISTS homepage_blocks (
        kind TEXT PRIMARY KEY,
        is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        title TEXT NOT NULL DEFAULT '',
        subtitle TEXT NOT NULL DEFAULT '',
        button_text TEXT NOT NULL DEFAULT '',
        button_link TEXT NOT NULL DEFAULT '',
        cards_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `.then(() => undefined);
  }
  await schemaReady;
}

function normalizeCards(value: unknown, kind: HomepageBlockKind): HomepageBlockCard[] {
  if (!Array.isArray(value)) {
    return DEFAULT_BLOCKS[kind].cards.map((card) => ({ ...card }));
  }

  return value
    .map((entry, index): HomepageBlockCard | null => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const candidate = entry as Partial<HomepageBlockCard>;
      const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
      const imageUrl = typeof candidate.imageUrl === "string" ? candidate.imageUrl.trim() : "";
      if (!title && !imageUrl) {
        return null;
      }

      return {
        id:
          typeof candidate.id === "string" && candidate.id.trim()
            ? candidate.id.trim()
            : `${kind}-card-${index}`,
        imageUrl,
        title: title.slice(0, 120),
        subtitle:
          typeof candidate.subtitle === "string" ? candidate.subtitle.trim().slice(0, 240) : "",
        buttonText:
          typeof candidate.buttonText === "string" ? candidate.buttonText.trim().slice(0, 60) : "",
        buttonLink:
          typeof candidate.buttonLink === "string"
            ? candidate.buttonLink.trim().slice(0, 500)
            : "",
        isEnabled: typeof candidate.isEnabled === "boolean" ? candidate.isEnabled : true,
        sortOrder: Number.isFinite(candidate.sortOrder) ? Number(candidate.sortOrder) : index,
      };
    })
    .filter((card): card is HomepageBlockCard => Boolean(card))
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .slice(0, 12)
    .map((card, index) => ({ ...card, sortOrder: index }));
}

function normalizeBlock(kind: HomepageBlockKind, value: Partial<HomepageBlock>): HomepageBlock {
  const fallback = DEFAULT_BLOCKS[kind];
  return {
    kind,
    isEnabled: typeof value.isEnabled === "boolean" ? value.isEnabled : fallback.isEnabled,
    title: typeof value.title === "string" ? value.title.trim().slice(0, 160) : fallback.title,
    subtitle:
      typeof value.subtitle === "string"
        ? value.subtitle.trim().slice(0, 320)
        : fallback.subtitle,
    buttonText:
      typeof value.buttonText === "string"
        ? value.buttonText.trim().slice(0, 60)
        : fallback.buttonText,
    buttonLink:
      typeof value.buttonLink === "string"
        ? value.buttonLink.trim().slice(0, 500)
        : fallback.buttonLink,
    cards: normalizeCards(value.cards, kind),
    updatedAt:
      typeof value.updatedAt === "string" && value.updatedAt
        ? value.updatedAt
        : new Date().toISOString(),
  };
}

async function readAllFileBlocks(): Promise<Record<HomepageBlockKind, HomepageBlock>> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Record<HomepageBlockKind, HomepageBlock>>;
    return Object.fromEntries(
      HOMEPAGE_BLOCK_KINDS.map((kind) => [kind, normalizeBlock(kind, parsed[kind] ?? {})]),
    ) as Record<HomepageBlockKind, HomepageBlock>;
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(DEFAULT_BLOCKS, null, 2), "utf8");
    return DEFAULT_BLOCKS;
  }
}

async function writeFileBlock(kind: HomepageBlockKind, block: HomepageBlock): Promise<void> {
  const all = await readAllFileBlocks();
  all[kind] = block;
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(all, null, 2), "utf8");
}

function rowToBlock(row: HomepageBlockRow): HomepageBlock {
  const kind = isHomepageBlockKind(row.kind) ? row.kind : "featured";
  return normalizeBlock(kind, {
    isEnabled: row.is_enabled,
    title: row.title,
    subtitle: row.subtitle,
    buttonText: row.button_text,
    buttonLink: row.button_link,
    cards: (row.cards_json as HomepageBlockCard[]) ?? [],
    updatedAt: new Date(row.updated_at).toISOString(),
  });
}

export async function getAllHomepageBlocks(): Promise<Record<HomepageBlockKind, HomepageBlock>> {
  const sql = getSqlClient();
  if (!sql) {
    return readAllFileBlocks();
  }

  await ensureSchema();
  const rows = await sql<HomepageBlockRow[]>`SELECT * FROM homepage_blocks`;
  const byKind = new Map(rows.map((row) => [row.kind, rowToBlock(row)]));

  return Object.fromEntries(
    HOMEPAGE_BLOCK_KINDS.map((kind) => [kind, byKind.get(kind) ?? DEFAULT_BLOCKS[kind]]),
  ) as Record<HomepageBlockKind, HomepageBlock>;
}

export async function getHomepageBlock(kind: HomepageBlockKind): Promise<HomepageBlock> {
  const sql = getSqlClient();
  if (!sql) {
    const all = await readAllFileBlocks();
    return all[kind];
  }

  await ensureSchema();
  const rows = await sql<HomepageBlockRow[]>`
    SELECT * FROM homepage_blocks WHERE kind = ${kind} LIMIT 1
  `;
  return rows[0] ? rowToBlock(rows[0]) : DEFAULT_BLOCKS[kind];
}

export type HomepageBlockUpdateInput = Partial<Omit<HomepageBlock, "kind" | "updatedAt">>;

export async function updateHomepageBlock(
  kind: HomepageBlockKind,
  patch: HomepageBlockUpdateInput,
): Promise<HomepageBlock> {
  const current = await getHomepageBlock(kind);
  const next = normalizeBlock(kind, {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  });

  const sql = getSqlClient();
  if (!sql) {
    await writeFileBlock(kind, next);
    return next;
  }

  await ensureSchema();
  const rows = await sql<HomepageBlockRow[]>`
    INSERT INTO homepage_blocks (kind, is_enabled, title, subtitle, button_text, button_link, cards_json, updated_at)
    VALUES (${kind}, ${next.isEnabled}, ${next.title}, ${next.subtitle}, ${next.buttonText}, ${next.buttonLink}, ${sql.json(next.cards)}, ${next.updatedAt})
    ON CONFLICT (kind) DO UPDATE SET
      is_enabled = EXCLUDED.is_enabled,
      title = EXCLUDED.title,
      subtitle = EXCLUDED.subtitle,
      button_text = EXCLUDED.button_text,
      button_link = EXCLUDED.button_link,
      cards_json = EXCLUDED.cards_json,
      updated_at = EXCLUDED.updated_at
    RETURNING *
  `;
  return rows[0] ? rowToBlock(rows[0]) : next;
}

export { HOMEPAGE_BLOCK_KINDS };
export type { HomepageBlock, HomepageBlockCard, HomepageBlockKind };
