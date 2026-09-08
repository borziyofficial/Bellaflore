// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Хранение зон доставки (Postgres + graceful fallback)
//
// Purpose (EN): Server-only persistence for Admin-edited delivery zones.
// Follows the same self-provisioning pattern already used in this project
// for admin-config tables (see lib/heroBannerDb.ts, lib/promoBannerDb.ts):
// the `delivery_zones` table is created with CREATE TABLE IF NOT EXISTS the
// first time it's needed — additive only, nothing about any other table
// changes, and if DATABASE_URL isn't configured every function here simply
// returns null so callers fall back to the built-in static catalog.
//
// Zones 2–7's polygons are NEVER stored — only Zone 1's polygon (base) plus
// each zone's metadata (title/label/color/opacity/price/time/active) and
// its fixed outer distance are. Zones 2–7 are always rebuilt from Zone 1's
// polygon via rebuildDeliveryZoneCatalogEntries() (the same robust
// buffer/offset algorithm used everywhere else), so there is no way for
// them to drift out of sync with an edited Zone 1 — this is the single
// source of truth the task asked for.
//
// Назначение (RU): Серверное хранение зон доставки, редактируемых в
// админке. Тот же паттерн самопровижининга, что уже используется в проекте
// для админ-настроек (lib/heroBannerDb.ts, lib/promoBannerDb.ts): таблица
// `delivery_zones` создаётся через CREATE TABLE IF NOT EXISTS при первом
// обращении — только аддитивно, другие таблицы не меняются; если
// DATABASE_URL не настроен, все функции возвращают null, и вызывающий код
// использует встроенный статический каталог.
//
// Полигоны зон 2–7 никогда не хранятся — хранится только полигон зоны 1
// (base) и метаданные каждой зоны (название/цвет/прозрачность/цена/время/
// активность) плюс её фиксированное расстояние. Зоны 2–7 всегда
// перестраиваются из полигона зоны 1 через rebuildDeliveryZoneCatalogEntries()
// (тот же устойчивый buffer/offset, что и везде) — поэтому они не могут
// разойтись с отредактированной зоной 1.
// ==================================================
import "server-only";

import postgres from "postgres";
import { getDatabaseUrl } from "@/lib/catalogDb/config";
import {
  applyDeliveryZoneOverrides,
  DEFAULT_DELIVERY_ZONE_META,
  rebuildDeliveryZoneCatalogEntries,
  type DeliveryZoneCatalogEntry,
  type DeliveryZoneMetaOverride,
} from "@/components/deliveryZones/deliveryZonesCatalog";
import {
  applyMkadPolygonOverride,
  DEFAULT_MKAD_POLYGON_COORDINATES,
} from "@/components/deliveryZones/mkadGeometry";
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";
import { validateZonePolygon } from "@/components/deliveryZones/polygonValidation";
import type { GeoCoordinate } from "@/components/maps/distanceTypes";

const ZONE_IDS: DeliveryZoneId[] = [
  "base",
  "7km",
  "14km",
  "21km",
  "28km",
  "38km",
  "48km",
];

type DeliveryZoneRow = {
  zone_id: string;
  title: string;
  label: string;
  color: string;
  fill_opacity: number | string;
  price_rub: number | string;
  estimated_time: string;
  is_active: boolean;
  base_polygon: GeoCoordinate[] | null;
  updated_at: string | Date;
};

let sqlClient: ReturnType<typeof postgres> | null = null;
let schemaReady: Promise<void> | null = null;

function getSqlClient(): ReturnType<typeof postgres> | null {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    return null;
  }
  if (!sqlClient) {
    sqlClient = postgres(databaseUrl, { max: 2 });
  }
  return sqlClient;
}

async function ensureSchema(sql: ReturnType<typeof postgres>): Promise<void> {
  if (!schemaReady) {
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS delivery_zones (
        zone_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        label TEXT NOT NULL,
        color TEXT NOT NULL,
        fill_opacity DOUBLE PRECISION NOT NULL DEFAULT 0.22,
        price_rub INTEGER NOT NULL,
        estimated_time TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        base_polygon JSONB,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `.then(() => undefined);
  }
  await schemaReady;
}

async function seedIfEmpty(sql: ReturnType<typeof postgres>): Promise<void> {
  const [{ count }] = await sql<{ count: string }[]>`
    SELECT COUNT(*)::text AS count FROM delivery_zones
  `;
  if (Number(count) > 0) {
    return;
  }

  for (const zoneId of ZONE_IDS) {
    const meta = DEFAULT_DELIVERY_ZONE_META[zoneId];
    const basePolygon =
      zoneId === "base" ? JSON.stringify(DEFAULT_MKAD_POLYGON_COORDINATES) : null;
    await sql`
      INSERT INTO delivery_zones (
        zone_id, title, label, color, fill_opacity, price_rub,
        estimated_time, is_active, base_polygon
      ) VALUES (
        ${zoneId}, ${meta.title}, ${meta.label}, ${meta.color},
        ${meta.fillOpacity}, ${meta.priceRub}, ${meta.estimatedTime},
        ${meta.isActive}, ${basePolygon}
      )
      ON CONFLICT (zone_id) DO NOTHING
    `;
  }
}

function rowsToEntries(rows: DeliveryZoneRow[]): DeliveryZoneCatalogEntry[] | null {
  const baseRow = rows.find((row) => row.zone_id === "base");
  if (!baseRow || !baseRow.base_polygon || baseRow.base_polygon.length < 3) {
    return null;
  }

  const metaByZoneId: Partial<Record<DeliveryZoneId, DeliveryZoneMetaOverride>> = {};
  for (const row of rows) {
    if (!ZONE_IDS.includes(row.zone_id as DeliveryZoneId)) {
      continue;
    }
    metaByZoneId[row.zone_id as DeliveryZoneId] = {
      title: row.title,
      label: row.label,
      color: row.color,
      fillOpacity: Number(row.fill_opacity),
      priceRub: Number(row.price_rub),
      estimatedTime: row.estimated_time,
      isActive: row.is_active,
    };
  }

  // Any zone missing a DB row (shouldn't happen once seeded) keeps its
  // built-in default metadata rather than being dropped.
  return rebuildDeliveryZoneCatalogEntries(baseRow.base_polygon, metaByZoneId);
}

/**
 * Reads the current admin-saved zones. Returns null when the DB isn't
 * configured/reachable, or when the stored data isn't usable — callers must
 * treat null as "use the built-in defaults", never as an error to surface.
 */
export async function getDeliveryZoneEntriesFromDb(): Promise<
  DeliveryZoneCatalogEntry[] | null
> {
  const sql = getSqlClient();
  if (!sql) {
    return null;
  }

  try {
    await ensureSchema(sql);
    await seedIfEmpty(sql);
    const rows = await sql<DeliveryZoneRow[]>`SELECT * FROM delivery_zones`;
    return rowsToEntries(rows);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const errorCode = err instanceof Error && "code" in err ? (err as any).code : "UNKNOWN";
    console.error(`[deliveryZonesDb] getDeliveryZoneEntriesFromDb: ${errorCode} - ${errorMsg}`);
    return null;
  }
}

export type DeliveryZoneAdminRow = {
  zoneId: DeliveryZoneId;
  title: string;
  label: string;
  color: string;
  fillOpacity: number;
  priceRub: number;
  estimatedTime: string;
  isActive: boolean;
  maxDistanceFromBaseKm: number;
  sortOrder: number;
  isBaseZone: boolean;
  basePolygon: GeoCoordinate[] | null;
  updatedAt: string;
};

/** Full admin view: metadata for all 7 zones plus Zone 1's editable polygon. */
export async function getDeliveryZonesForAdmin(): Promise<
  DeliveryZoneAdminRow[] | null
> {
  const sql = getSqlClient();
  if (!sql) {
    return null;
  }

  try {
    await ensureSchema(sql);
    await seedIfEmpty(sql);
    const rows = await sql<DeliveryZoneRow[]>`SELECT * FROM delivery_zones`;
    const entries = rowsToEntries(rows);
    if (!entries) {
      return null;
    }
    const rowByZoneId = new Map(rows.map((row) => [row.zone_id, row]));

    return entries.map((entry) => ({
      zoneId: entry.zoneId,
      title: entry.title,
      label: entry.label,
      color: entry.color,
      fillOpacity: entry.fillOpacity,
      priceRub: entry.priceRub,
      estimatedTime: entry.estimatedTime,
      isActive: entry.isActive,
      maxDistanceFromBaseKm: entry.maxDistanceFromBaseKm,
      sortOrder: entry.sortOrder,
      isBaseZone: entry.isBaseZone,
      basePolygon: entry.isBaseZone ? entry.polygonCoordinates : null,
      updatedAt: new Date(
        rowByZoneId.get(entry.zoneId)?.updated_at ?? Date.now(),
      ).toISOString(),
    }));
  } catch {
    return null;
  }
}

export type DeliveryZoneMetaPatch = Partial<{
  title: string;
  label: string;
  color: string;
  fillOpacity: number;
  priceRub: number;
  estimatedTime: string;
  isActive: boolean;
}>;

export type DeliveryZoneWriteResult =
  | { ok: true; zones: DeliveryZoneAdminRow[] }
  | { ok: false; error: string };

function validateMetaPatch(patch: DeliveryZoneMetaPatch): string | null {
  if (patch.color !== undefined && !/^#[0-9a-fA-F]{6}$/.test(patch.color)) {
    return "Цвет должен быть в формате #RRGGBB.";
  }
  if (
    patch.fillOpacity !== undefined &&
    (!Number.isFinite(patch.fillOpacity) ||
      patch.fillOpacity < 0 ||
      patch.fillOpacity > 1)
  ) {
    return "Прозрачность должна быть числом от 0 до 1.";
  }
  if (
    patch.priceRub !== undefined &&
    (!Number.isFinite(patch.priceRub) || patch.priceRub < 0)
  ) {
    return "Стоимость доставки не может быть отрицательной.";
  }
  if (patch.title !== undefined && patch.title.trim().length === 0) {
    return "Название зоны не может быть пустым.";
  }
  return null;
}

/** Updates one zone's editable metadata (not its geometry). */
export async function updateDeliveryZoneMeta(
  zoneId: DeliveryZoneId,
  patch: DeliveryZoneMetaPatch,
): Promise<DeliveryZoneWriteResult> {
  const validationError = validateMetaPatch(patch);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const sql = getSqlClient();
  if (!sql) {
    return {
      ok: false,
      error: "Хранилище зон доставки не настроено (нет DATABASE_URL).",
    };
  }

  try {
    await ensureSchema(sql);
    await seedIfEmpty(sql);

    const current = await sql<DeliveryZoneRow[]>`
      SELECT * FROM delivery_zones WHERE zone_id = ${zoneId} LIMIT 1
    `;
    const existing = current[0];
    if (!existing) {
      return { ok: false, error: "Зона не найдена." };
    }

    await sql`
      UPDATE delivery_zones SET
        title = ${patch.title ?? existing.title},
        label = ${patch.label ?? existing.label},
        color = ${patch.color ?? existing.color},
        fill_opacity = ${patch.fillOpacity ?? Number(existing.fill_opacity)},
        price_rub = ${patch.priceRub ?? Number(existing.price_rub)},
        estimated_time = ${patch.estimatedTime ?? existing.estimated_time},
        is_active = ${patch.isActive ?? existing.is_active},
        updated_at = NOW()
      WHERE zone_id = ${zoneId}
    `;

    const zones = await getDeliveryZonesForAdmin();
    if (!zones) {
      return { ok: false, error: "Не удалось прочитать зоны после сохранения." };
    }
    invalidateHydrationCache();
    return { ok: true, zones };
  } catch {
    return { ok: false, error: "Не удалось сохранить зону." };
  }
}

/**
 * Replaces Zone 1's polygon. Zones 2–7 are never written here — they are
 * always derived at read time from this polygon.
 */
export async function updateBaseZonePolygon(
  polygon: GeoCoordinate[],
): Promise<DeliveryZoneWriteResult> {
  const validation = validateZonePolygon(polygon);
  if (!validation.valid) {
    return { ok: false, error: validation.reason };
  }

  const sql = getSqlClient();
  if (!sql) {
    return {
      ok: false,
      error: "Хранилище зон доставки не настроено (нет DATABASE_URL).",
    };
  }

  try {
    await ensureSchema(sql);
    await seedIfEmpty(sql);

    await sql`
      UPDATE delivery_zones
      SET base_polygon = ${JSON.stringify(polygon)}::jsonb, updated_at = NOW()
      WHERE zone_id = 'base'
    `;

    const zones = await getDeliveryZonesForAdmin();
    if (!zones) {
      return { ok: false, error: "Не удалось прочитать зоны после сохранения." };
    }
    invalidateHydrationCache();
    return { ok: true, zones };
  } catch {
    return { ok: false, error: "Не удалось сохранить полигон зоны 1." };
  }
}

// ==================================================
// SECTION: HYDRATION
// РАЗДЕЛ: Гидратация статического каталога из БД
//
// Purpose (EN): Called from server-side delivery calculation
// (lib/orders/deliveryPricing.ts) before every price/zone lookup, so the
// live catalog (components/deliveryZones/deliveryZonesCatalog.ts) reflects
// admin-saved zones without a redeploy. TTL-cached to avoid hitting the DB
// on every single request; always safe to call (never throws, no-ops if the
// DB is unavailable or unchanged).
// ==================================================
const HYDRATION_TTL_MS = 30_000;
let lastHydrationAt = 0;
let hydrationInFlight: Promise<void> | null = null;

function invalidateHydrationCache(): void {
  lastHydrationAt = 0;
}

export async function hydrateDeliveryZonesCatalogFromDb(): Promise<void> {
  const now = Date.now();
  if (now - lastHydrationAt < HYDRATION_TTL_MS) {
    return;
  }
  if (hydrationInFlight) {
    await hydrationInFlight;
    return;
  }

  hydrationInFlight = (async () => {
    try {
      const entries = await getDeliveryZoneEntriesFromDb();
      if (entries) {
        applyDeliveryZoneOverrides(entries);
        const baseEntry = entries.find((entry) => entry.isBaseZone);
        if (baseEntry) {
          applyMkadPolygonOverride(baseEntry.polygonCoordinates);
        }
      }
      lastHydrationAt = Date.now();
    } catch {
      // Defensive: hydration must never break order pricing/creation.
    } finally {
      hydrationInFlight = null;
    }
  })();

  await hydrationInFlight;
}
