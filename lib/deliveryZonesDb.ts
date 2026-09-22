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
  max_distance_from_base_km: number | string | null;
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
    schemaReady = (async () => {
      await sql`
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
          max_distance_from_base_km DOUBLE PRECISION,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      // Safe migration for production DBs created before this column
      // existed (additive only — ADD COLUMN IF NOT EXISTS is a no-op on a
      // table that already has it, and is a fast metadata-only change on
      // Postgres since the new column has no NOT NULL/default to backfill
      // synchronously).
      await sql`
        ALTER TABLE delivery_zones
        ADD COLUMN IF NOT EXISTS max_distance_from_base_km DOUBLE PRECISION
      `;

      // Backfill any row left NULL by the ALTER above (i.e. every zone row
      // that existed before this migration) with the exact same distances
      // that were previously hardcoded in ZONE_SHAPE_DEFINITIONS, so no
      // existing production zone silently changes its real boundary the
      // first time this runs. Idempotent (WHERE ... IS NULL) and cheap —
      // this table only ever has 7 rows.
      for (const zoneId of ZONE_IDS) {
        const fallbackKm = DEFAULT_DELIVERY_ZONE_META[zoneId].maxDistanceFromBaseKm;
        await sql`
          UPDATE delivery_zones
          SET max_distance_from_base_km = ${fallbackKm}
          WHERE zone_id = ${zoneId} AND max_distance_from_base_km IS NULL
        `;
      }
    })();
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
        estimated_time, is_active, base_polygon, max_distance_from_base_km
      ) VALUES (
        ${zoneId}, ${meta.title}, ${meta.label}, ${meta.color},
        ${meta.fillOpacity}, ${meta.priceRub}, ${meta.estimatedTime},
        ${meta.isActive}, ${basePolygon}, ${meta.maxDistanceFromBaseKm}
      )
      ON CONFLICT (zone_id) DO NOTHING
    `;
  }
}

/**
 * Parse polygon from database. JSONB may come as parsed array or as string
 * depending on the postgres driver version. Ensure it's always an array.
 */
function parsePolygon(data: unknown): GeoCoordinate[] | null {
  if (!data) return null;
  
  // If it's already an array, use it
  if (Array.isArray(data)) {
    return data as GeoCoordinate[];
  }
  
  // If it's a string, parse it
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  
  return null;
}

function rowsToEntries(rows: DeliveryZoneRow[]): DeliveryZoneCatalogEntry[] | null {
  const baseRow = rows.find((row) => row.zone_id === "base");
  if (!baseRow) {
    return null;
  }

  // Parse polygon from database (may be string or array)
  const basePolygon = parsePolygon(baseRow.base_polygon);
  if (!basePolygon || basePolygon.length < 3) {
    return null;
  }

  const metaByZoneId: Partial<Record<DeliveryZoneId, DeliveryZoneMetaOverride>> = {};
  for (const row of rows) {
    if (!ZONE_IDS.includes(row.zone_id as DeliveryZoneId)) {
      continue;
    }
    const zoneId = row.zone_id as DeliveryZoneId;
    // Defensive fallback: a row can only have a NULL
    // max_distance_from_base_km in the brief window between the ALTER
    // TABLE and backfill in ensureSchema() — never in steady state — but
    // real calculation must never silently treat that as 0/unbounded.
    const maxDistanceFromBaseKm =
      row.max_distance_from_base_km !== null && row.max_distance_from_base_km !== undefined
        ? Number(row.max_distance_from_base_km)
        : DEFAULT_DELIVERY_ZONE_META[zoneId].maxDistanceFromBaseKm;
    metaByZoneId[zoneId] = {
      title: row.title,
      label: row.label,
      color: row.color,
      fillOpacity: Number(row.fill_opacity),
      priceRub: Number(row.price_rub),
      estimatedTime: row.estimated_time,
      isActive: row.is_active,
      maxDistanceFromBaseKm,
    };
  }

  // Any zone missing a DB row (shouldn't happen once seeded) keeps its
  // built-in default metadata rather than being dropped.
  return rebuildDeliveryZoneCatalogEntries(basePolygon, metaByZoneId);
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
  maxDistanceFromBaseKm: number;
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
  if (
    patch.maxDistanceFromBaseKm !== undefined &&
    (!Number.isFinite(patch.maxDistanceFromBaseKm) || patch.maxDistanceFromBaseKm <= 0)
  ) {
    return "Внешняя граница зоны должна быть положительным числом (км).";
  }
  return null;
}

/**
 * Zone boundaries must strictly increase along the fixed zoneId order
 * (base=0 is implicit, then 7km < 14km < 21km < 28km < 38km < 48km).
 * Checks the proposed new value for `zoneId` against every other zone's
 * CURRENT saved value (or its default, if the DB row hasn't been backfilled
 * yet) — this is the authoritative check; the Admin UI also pre-checks
 * client-side for immediate feedback, but this is what actually guards the
 * data.
 */
function validateDistanceOrdering(
  rows: DeliveryZoneRow[],
  zoneId: DeliveryZoneId,
  newDistanceKm: number,
): string | null {
  const distanceByZoneId = new Map<DeliveryZoneId, number>();
  for (const id of ZONE_IDS) {
    if (id === "base") {
      distanceByZoneId.set(id, 0);
      continue;
    }
    const row = rows.find((candidate) => candidate.zone_id === id);
    const current =
      row?.max_distance_from_base_km !== null && row?.max_distance_from_base_km !== undefined
        ? Number(row.max_distance_from_base_km)
        : DEFAULT_DELIVERY_ZONE_META[id].maxDistanceFromBaseKm;
    distanceByZoneId.set(id, current);
  }
  distanceByZoneId.set(zoneId, newDistanceKm);

  let previousKm = 0;
  for (const id of ZONE_IDS) {
    if (id === "base") {
      continue;
    }
    const valueKm = distanceByZoneId.get(id)!;
    if (!Number.isFinite(valueKm) || valueKm <= previousKm) {
      return `Границы зон должны строго возрастать (например: 0 / 7 / 14 / 21 / 28 / 35 / 50). Зона «${id}» (${valueKm} км) должна быть больше предыдущей (${previousKm} км).`;
    }
    previousKm = valueKm;
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

  if (zoneId === "base" && patch.maxDistanceFromBaseKm !== undefined) {
    return {
      ok: false,
      error: "Зона 1 (внутри МКАД) не редактируется как километровая зона — её граница всегда 0.",
    };
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

    const rows = await sql<DeliveryZoneRow[]>`SELECT * FROM delivery_zones`;
    const existing = rows.find((row) => row.zone_id === zoneId);
    if (!existing) {
      return { ok: false, error: "Зона не найдена." };
    }

    if (patch.maxDistanceFromBaseKm !== undefined) {
      const orderingError = validateDistanceOrdering(rows, zoneId, patch.maxDistanceFromBaseKm);
      if (orderingError) {
        return { ok: false, error: orderingError };
      }
    }

    const existingDistanceKm =
      existing.max_distance_from_base_km !== null && existing.max_distance_from_base_km !== undefined
        ? Number(existing.max_distance_from_base_km)
        : DEFAULT_DELIVERY_ZONE_META[zoneId].maxDistanceFromBaseKm;

    await sql`
      UPDATE delivery_zones SET
        title = ${patch.title ?? existing.title},
        label = ${patch.label ?? existing.label},
        color = ${patch.color ?? existing.color},
        fill_opacity = ${patch.fillOpacity ?? Number(existing.fill_opacity)},
        price_rub = ${patch.priceRub ?? Number(existing.price_rub)},
        estimated_time = ${patch.estimatedTime ?? existing.estimated_time},
        is_active = ${patch.isActive ?? existing.is_active},
        max_distance_from_base_km = ${patch.maxDistanceFromBaseKm ?? existingDistanceKm},
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
