// ==================================================
// SECTION: ADMIN APP — Zone 1 (MKAD) polygon editor map
// РАЗДЕЛ: Редактор полигона Зоны 1 (МКАД) на карте
//
// Purpose (EN): Interactive Yandex Maps polygon editor for the Admin
// delivery-zones section. Renders Zone 1's base polygon as an editable
// ymaps.Polygon using the native Yandex editor (drag existing points, add a
// point by dragging an edge midpoint, delete a point via double-click) —
// this is the same built-in UX Yandex ships, not a custom reimplementation.
//
// The polygon is created ONCE per `resetKey` (bumped by the parent on load
// and on "Отменить изменения"); after that its coordinates are read only
// on demand (via the imperative `getCurrentPolygon` handle) so a live React
// re-render never fights the user mid-drag.
//
// Назначение (RU): Интерактивный редактор полигона Зоны 1 на карте Яндекс
// для раздела «Зоны доставки» в админке. Полигон создаётся один раз на
// каждый `resetKey`, а координаты считываются по требованию (через ref),
// чтобы React не мешал перетаскиванию точек.
// ==================================================
"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { loadConfiguredYandexMapsSdk } from "@/components/maps/loadYandexMapsSdk";
import { getYandexMapsApiKey } from "@/components/maps/mapProviderConfig";
import { isYandexMapsPreviewEnabled } from "@/components/maps/mapProviderRegistry";
import type { YandexMap, YandexPolygon } from "@/components/maps/yandexMapsApi.types";
import type { GeoCoordinate } from "@/components/maps/distanceTypes";
import styles from "@/components/adminApp/modules/deliveryZones/AdminZonePolygonEditorMap.module.css";

export type AdminZonePolygonEditorMapHandle = {
  /** Reads the polygon's current coordinates directly from the live Yandex
   * geometry (not from React state) so the result always matches whatever
   * the admin has dragged/added/removed, even mid-session. */
  getCurrentPolygon: () => GeoCoordinate[] | null;
};

type AdminZonePolygonEditorMapProps = {
  initialPolygon: GeoCoordinate[];
  /** Bump to force the editable polygon to be rebuilt from `initialPolygon`
   * (used after a successful save and after "Отменить изменения"). */
  resetKey: number;
};

function computeCentroid(points: GeoCoordinate[]): GeoCoordinate {
  const totals = points.reduce(
    (accumulator, point) => ({
      latitude: accumulator.latitude + point.latitude,
      longitude: accumulator.longitude + point.longitude,
    }),
    { latitude: 0, longitude: 0 },
  );
  return {
    latitude: totals.latitude / points.length,
    longitude: totals.longitude / points.length,
  };
}

function canMountYandexMap(): boolean {
  return isYandexMapsPreviewEnabled() && Boolean(getYandexMapsApiKey());
}

export const AdminZonePolygonEditorMap = forwardRef<
  AdminZonePolygonEditorMapHandle,
  AdminZonePolygonEditorMapProps
>(function AdminZonePolygonEditorMap({ initialPolygon, resetKey }, forwardedRef) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<YandexMap | null>(null);
  const polygonRef = useRef<YandexPolygon | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadErrorDetail, setLoadErrorDetail] = useState<string | null>(null);
  const [pointCount, setPointCount] = useState(initialPolygon.length);

  const center = useMemo(
    () =>
      initialPolygon.length > 0
        ? computeCentroid(initialPolygon)
        : { latitude: 55.7558, longitude: 37.6173 },
    // Only recompute when the map is (re)built for a new resetKey — not on
    // every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resetKey],
  );

  useImperativeHandle(
    forwardedRef,
    () => ({
      getCurrentPolygon: () => {
        const polygon = polygonRef.current;
        if (!polygon) {
          return null;
        }
        const rings = polygon.geometry.getCoordinates();
        const outerRing = rings[0];
        if (!outerRing || outerRing.length < 3) {
          return null;
        }
        return outerRing.map(([latitude, longitude]) => ({ latitude, longitude }));
      },
    }),
    [],
  );

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || !canMountYandexMap()) {
      setLoadState("error");
      return;
    }

    let isDisposed = false;
    setLoadState("loading");
    setLoadErrorDetail(null);

    void loadConfiguredYandexMapsSdk()
      .then((ymaps) => {
        if (isDisposed) {
          return;
        }

        try {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.destroy();
            mapInstanceRef.current = null;
          }

          container.replaceChildren();

          const map = new ymaps.Map(
            container,
            {
              center: [center.latitude, center.longitude],
              zoom: 10,
              controls: ["zoomControl"],
            },
            { suppressMapOpenBlock: true },
          );
          mapInstanceRef.current = map;

          const ring = initialPolygon.map(
            (point) => [point.latitude, point.longitude] as [number, number],
          );

          const polygon = new ymaps.Polygon(
            [ring],
            {},
            {
              fillColor: "#8a6b3d33",
              strokeColor: "#8a6b3d",
              strokeWidth: 3,
              fillOpacity: 0.2,
              strokeOpacity: 0.9,
            },
          );

          polygon.events.add("geometrychange", () => {
            const rings = polygon.geometry.getCoordinates();
            setPointCount(rings[0]?.length ?? 0);
          });

          map.geoObjects.add(polygon);
          polygonRef.current = polygon;
          polygon.editor.startEditing();
          setPointCount(ring.length);

          setLoadState("ready");
          requestAnimationFrame(() => {
            map.container?.fitToViewport();
          });
        } catch (error) {
          if (!isDisposed) {
            setLoadErrorDetail(
              error instanceof Error ? error.message : "Yandex Maps SDK initialization failed.",
            );
            setLoadState("error");
          }
        }
      })
      .catch((error) => {
        if (!isDisposed) {
          setLoadErrorDetail(
            error instanceof Error ? error.message : "Failed to load Yandex Maps SDK.",
          );
          setLoadState("error");
        }
      });

    return () => {
      isDisposed = true;
      if (polygonRef.current) {
        polygonRef.current.editor.stopEditing();
        polygonRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
      container.replaceChildren();
    };
    // Rebuild only when resetKey changes (or the initial mount) — not on
    // every `initialPolygon` reference change, since that prop is only
    // meant to seed the editor once per resetKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  return (
    <div className={styles.mapWrap}>
      <div className={styles.mapFrame} ref={mapContainerRef} />
      {loadState === "loading" ? (
        <div className={styles.overlay} aria-hidden="true">
          <p>Загрузка карты…</p>
        </div>
      ) : null}
      {loadState === "error" ? (
        <div className={`${styles.overlay} ${styles.overlayError}`}>
          <p>
            Не удалось загрузить карту Яндекс.
            {loadErrorDetail ? ` (${loadErrorDetail})` : ""}
          </p>
        </div>
      ) : null}
      {loadState === "ready" ? (
        <p className={styles.hint}>
          Точек в полигоне: {pointCount}. Перетаскивайте точки, чтобы изменить границу; потяните
          середину ребра, чтобы добавить точку; дважды щёлкните по точке, чтобы удалить её.
        </p>
      ) : null}
    </div>
  );
});
