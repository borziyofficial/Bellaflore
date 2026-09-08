// ==================================================
// SECTION: ADMIN APP — Delivery zones module
// РАЗДЕЛ: Модуль «Зоны доставки»
//
// Purpose (EN): Admin management of the 7 delivery zones — Zone 1's MKAD
// polygon (via an interactive map editor) plus per-zone metadata (title,
// color, opacity, price, ETA, active flag). Reads/writes the single shared
// `delivery_zones` table (lib/deliveryZonesDb.ts) that checkout, zone
// detection, pricing, and the storefront map already read from — there is
// no separate/parallel zone system here.
//
// Назначение (RU): Управление 7 зонами доставки в админке — полигон Зоны 1
// (МКАД) через интерактивный редактор на карте плюс метаданные каждой зоны
// (название, цвет, прозрачность, цена, время, активность). Работает с той
// же таблицей `delivery_zones`, что и checkout/расчёт зоны/тариф/карта —
// отдельной системы зон не создаётся.
// ==================================================
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AdminModuleHeader, AdminPanel } from "@/components/adminApp/shared/AdminModuleUi";
import ui from "@/components/adminApp/shared/AdminModuleUi.module.css";
import styles from "@/components/adminApp/modules/deliveryZones/AdminDeliveryZonesModule.module.css";
import {
  AdminZonePolygonEditorMap,
  type AdminZonePolygonEditorMapHandle,
} from "@/components/adminApp/modules/deliveryZones/AdminZonePolygonEditorMap";
import type { GeoCoordinate } from "@/components/maps/distanceTypes";

export type DeliveryZoneId =
  | "base"
  | "7km"
  | "14km"
  | "21km"
  | "28km"
  | "38km"
  | "48km";

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

type ZoneDraft = {
  title: string;
  label: string;
  color: string;
  fillOpacity: number;
  priceRub: number;
  estimatedTime: string;
  isActive: boolean;
};

function draftFromRow(row: DeliveryZoneAdminRow): ZoneDraft {
  return {
    title: row.title,
    label: row.label,
    color: row.color,
    fillOpacity: row.fillOpacity,
    priceRub: row.priceRub,
    estimatedTime: row.estimatedTime,
    isActive: row.isActive,
  };
}

function isDraftDirty(draft: ZoneDraft, row: DeliveryZoneAdminRow): boolean {
  return (
    draft.title !== row.title ||
    draft.label !== row.label ||
    draft.color !== row.color ||
    draft.fillOpacity !== row.fillOpacity ||
    draft.priceRub !== row.priceRub ||
    draft.estimatedTime !== row.estimatedTime ||
    draft.isActive !== row.isActive
  );
}

function formatDistanceRange(row: DeliveryZoneAdminRow, allRows: DeliveryZoneAdminRow[]): string {
  if (row.isBaseZone) {
    return "Внутри МКАД";
  }
  const sorted = [...allRows].sort((a, b) => a.sortOrder - b.sortOrder);
  const index = sorted.findIndex((item) => item.zoneId === row.zoneId);
  const prev = index > 0 ? sorted[index - 1] : null;
  const fromKm = prev ? prev.maxDistanceFromBaseKm : 0;
  return `${fromKm}–${row.maxDistanceFromBaseKm} км от МКАД`;
}

function ZoneMetaCard({
  row,
  allRows,
  onSaved,
}: {
  row: DeliveryZoneAdminRow;
  allRows: DeliveryZoneAdminRow[];
  onSaved: (zones: DeliveryZoneAdminRow[]) => void;
}) {
  const [draft, setDraft] = useState<ZoneDraft>(() => draftFromRow(row));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const dirty = isDraftDirty(draft, row);

  const save = useCallback(async () => {
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/delivery-zones/${row.zoneId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zone: draft }),
      });
      const body = (await response.json()) as {
        zones?: DeliveryZoneAdminRow[];
        message?: string;
      };
      if (!response.ok) {
        throw new Error(body.message || "Не удалось сохранить зону.");
      }
      if (body.zones) {
        onSaved(body.zones);
      }
      setNotice({ tone: "success", text: "Сохранено." });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Не удалось сохранить зону.",
      });
    } finally {
      setSaving(false);
    }
  }, [draft, onSaved, row.zoneId]);

  return (
    <li className={styles.zoneCard}>
      <div className={styles.zoneCardHeader}>
        <span className={styles.zoneSwatch} style={{ background: draft.color }} aria-hidden="true" />
        <div className={styles.zoneCardHeaderText}>
          <p className={styles.zoneCardTitle}>{row.isBaseZone ? "Zone 1 (базовая, МКАД)" : `Zone: ${row.zoneId}`}</p>
          <p className={styles.zoneCardRange}>{formatDistanceRange(row, allRows)}</p>
        </div>
        <label className={`${styles.switch} ${draft.isActive ? styles.switchOn : ""}`}>
          <input
            type="checkbox"
            checked={draft.isActive}
            onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))}
          />
          <span />
        </label>
      </div>

      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span>Название</span>
          <input
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          />
        </label>
        <label className={styles.field}>
          <span>Подпись на карте</span>
          <input
            value={draft.label}
            onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
          />
        </label>
        <label className={styles.field}>
          <span>Цвет</span>
          <div className={styles.colorRow}>
            <input
              type="color"
              value={draft.color}
              onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))}
            />
            <input
              value={draft.color}
              onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))}
            />
          </div>
        </label>
        <label className={styles.field}>
          <span>Прозрачность заливки: {Math.round(draft.fillOpacity * 100)}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(draft.fillOpacity * 100)}
            onChange={(event) =>
              setDraft((current) => ({ ...current, fillOpacity: Number(event.target.value) / 100 }))
            }
          />
        </label>
        <label className={styles.field}>
          <span>Стоимость доставки, ₽</span>
          <input
            type="number"
            min={0}
            value={draft.priceRub}
            onChange={(event) =>
              setDraft((current) => ({ ...current, priceRub: Math.max(0, Number(event.target.value) || 0) }))
            }
          />
        </label>
        <label className={styles.field}>
          <span>Время доставки</span>
          <input
            value={draft.estimatedTime}
            onChange={(event) => setDraft((current) => ({ ...current, estimatedTime: event.target.value }))}
            placeholder="60–90 минут"
          />
        </label>
      </div>

      {notice ? <p className={styles[notice.tone]}>{notice.text}</p> : null}

      <div className={styles.buttonRow}>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={!dirty || saving}
          onClick={() => void save()}
        >
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
        {dirty ? <span className={styles.unsavedHint}>Есть несохранённые изменения</span> : null}
      </div>
    </li>
  );
}

export function AdminDeliveryZonesModule({
  initialZones,
}: {
  initialZones: DeliveryZoneAdminRow[] | null;
}) {
  const [zones, setZones] = useState<DeliveryZoneAdminRow[] | null>(initialZones);
  const [ready, setReady] = useState(Boolean(initialZones));
  const [loadNotice, setLoadNotice] = useState<string | null>(
    initialZones ? null : null,
  );
  const [polygonResetKey, setPolygonResetKey] = useState(0);
  const [savingPolygon, setSavingPolygon] = useState(false);
  const [polygonNotice, setPolygonNotice] = useState<{ tone: "success" | "error"; text: string } | null>(
    null,
  );
  const mapRef = useRef<AdminZonePolygonEditorMapHandle | null>(null);

  const loadZones = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/delivery-zones", {
        credentials: "include",
        cache: "no-store",
      });
      const body = (await response.json()) as {
        zones?: DeliveryZoneAdminRow[] | null;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(body.message || "Не удалось загрузить зоны доставки.");
      }
      if (body.zones) {
        setZones(body.zones);
        setLoadNotice(null);
      } else {
        setZones(null);
        setLoadNotice(
          body.message ?? "Хранилище зон доставки недоступно (нет DATABASE_URL).",
        );
      }
    } catch (error) {
      setLoadNotice(
        error instanceof Error ? error.message : "Не удалось загрузить зоны доставки.",
      );
    } finally {
      setReady(true);
    }
  }, []);

  useMemo(() => {
    if (!initialZones) {
      void loadZones();
    }
    // Runs once on mount only — `loadZones` is stable (useCallback, no deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const baseZone = zones?.find((zone) => zone.isBaseZone) ?? null;
  const sortedZones = useMemo(
    () => (zones ? [...zones].sort((a, b) => a.sortOrder - b.sortOrder) : []),
    [zones],
  );

  const savePolygon = useCallback(async () => {
    const currentPolygon = mapRef.current?.getCurrentPolygon();
    if (!currentPolygon || currentPolygon.length < 4) {
      setPolygonNotice({
        tone: "error",
        text: "В полигоне должно быть минимум 4 точки.",
      });
      return;
    }
    setSavingPolygon(true);
    setPolygonNotice(null);
    try {
      const response = await fetch("/api/admin/delivery-zones/base-polygon", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ polygon: currentPolygon }),
      });
      const body = (await response.json()) as {
        zones?: DeliveryZoneAdminRow[];
        message?: string;
      };
      if (!response.ok) {
        throw new Error(body.message || "Не удалось сохранить полигон зоны 1.");
      }
      if (body.zones) {
        setZones(body.zones);
      }
      setPolygonResetKey((key) => key + 1);
      setPolygonNotice({
        tone: "success",
        text: "Полигон Zone 1 сохранён. Zones 2–7 пересчитаны автоматически.",
      });
    } catch (error) {
      setPolygonNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Не удалось сохранить полигон зоны 1.",
      });
    } finally {
      setSavingPolygon(false);
    }
  }, []);

  const resetPolygon = useCallback(() => {
    setPolygonResetKey((key) => key + 1);
    setPolygonNotice(null);
  }, []);

  if (!ready) {
    return (
      <div className={styles.moduleRoot} aria-label="Загрузка зон доставки" aria-busy="true">
        <div className={styles.loadingHeader} />
        <div className={styles.loadingPanel} />
      </div>
    );
  }

  if (loadNotice) {
    return (
      <div className={`${ui.stack} ${styles.moduleRoot}`}>
        <AdminModuleHeader title="Зоны доставки" subtitle="Управление зонами доставки МКАД" />
        <AdminPanel>
          <p className={styles.error}>{loadNotice}</p>
        </AdminPanel>
      </div>
    );
  }

  if (!zones || !baseZone) {
    return (
      <div className={`${ui.stack} ${styles.moduleRoot}`}>
        <AdminModuleHeader title="Зоны доставки" subtitle="Управление зонами доставки МКАД" />
        <AdminPanel>
          <p className={styles.error}>Зоны доставки не найдены.</p>
        </AdminPanel>
      </div>
    );
  }

  return (
    <div className={`${ui.stack} ${styles.moduleRoot}`}>
      <AdminModuleHeader
        title="Зоны доставки"
        subtitle="Zone 1 = полигон МКАД (редактируется вручную), Zones 2–7 перестраиваются автоматически"
      />

      <AdminPanel title="Zone 1 — полигон МКАД">
        <AdminZonePolygonEditorMap
          ref={mapRef}
          initialPolygon={baseZone.basePolygon ?? []}
          resetKey={polygonResetKey}
        />
        {polygonNotice ? <p className={styles[polygonNotice.tone]}>{polygonNotice.text}</p> : null}
        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={savingPolygon}
            onClick={() => void savePolygon()}
          >
            {savingPolygon ? "Сохранение…" : "Сохранить полигон и пересчитать зоны 2–7"}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={resetPolygon} disabled={savingPolygon}>
            Отменить изменения
          </button>
        </div>
      </AdminPanel>

      <AdminPanel title="Все зоны">
        <ul className={styles.zoneList}>
          {sortedZones.map((zone) => (
            <ZoneMetaCard key={zone.zoneId} row={zone} allRows={sortedZones} onSaved={setZones} />
          ))}
        </ul>
      </AdminPanel>
    </div>
  );
}
