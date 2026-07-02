// ==================================================
// SECTION: MAP
// РАЗДЕЛ: Карта
//
// Purpose (EN):
// Yandex Maps preview for admin delivery and courier routes
//
// Назначение (RU):
// Превью Yandex Maps для маршрутов доставки
// ==================================================
"use client";

import styles from "@/components/maps/YandexMapPreview.module.css";
import { replaceLiveCourierPlacemarksOnYandexMap } from "@/components/admin/LiveCourierMap";
import { getCourierMapColor } from "@/components/maps/courierMapColors";
import { loadConfiguredYandexMapsSdk } from "@/components/maps/loadYandexMapsSdk";
import type { OrderMapPoint } from "@/components/maps/orderMapData";
import type { CourierRouteLine } from "@/components/maps/routeLineTypes";
import type { YandexCourierRoute } from "@/components/maps/yandexRoutingTypes";
import type {
  YandexGeoObject,
  YandexMap,
  YandexMapsApi,
} from "@/components/maps/yandexMapsApi.types";
import type { LiveCourierMapMarker } from "@/components/couriers/liveCourierMapData";
import { getOrderStatusLabel } from "@/components/orders/orderStatus";
import { useEffect, useRef, useState } from "react";

type YandexMapPreviewProps = {
  geocodedPoints: OrderMapPoint[];
  routeLines?: CourierRouteLine[];
  realRouteLines?: YandexCourierRoute[];
  showRouteLines?: boolean;
  liveCouriers?: LiveCourierMapMarker[];
  onOrderSelect: (orderId: string) => void;
};

const MOSCOW_CENTER: [number, number] = [55.7558, 37.6173];
const DEFAULT_ZOOM = 10;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildBalloonBody(point: OrderMapPoint): string {
  return [
    `<div><strong>Order ID:</strong> ${escapeHtml(point.orderId)}</div>`,
    `<div><strong>Customer:</strong> ${escapeHtml(point.customer)}</div>`,
    `<div><strong>Address:</strong> ${escapeHtml(point.address)}</div>`,
    `<div><strong>Delivery interval:</strong> ${escapeHtml(point.deliveryInterval)}</div>`,
    `<div><strong>Courier:</strong> ${escapeHtml(point.courier ?? "Unassigned")}</div>`,
    `<div><strong>Status:</strong> ${escapeHtml(getOrderStatusLabel(point.status))}</div>`,
  ].join("");
}

function resolveRoutePolyline(
  routeLine: CourierRouteLine,
  realRouteByCourierId: Map<string, YandexCourierRoute>,
): {
  coordinates: [number, number][];
  strokeWidth: number;
  strokeOpacity: number;
} {
  const realRoute = realRouteByCourierId.get(routeLine.courierId);

  if (
    realRoute?.status === "ready" &&
    realRoute.routeCoordinates.length >= 2
  ) {
    return {
      coordinates: realRoute.routeCoordinates.map((point) => [
        point.latitude,
        point.longitude,
      ]),
      strokeWidth: 5,
      strokeOpacity: 0.9,
    };
  }

  return {
    coordinates: routeLine.points.map((point) => [
      point.latitude,
      point.longitude,
    ]),
    strokeWidth: 4,
    strokeOpacity: 0.75,
  };
}

function syncMapGeoObjects(
  ymaps: YandexMapsApi,
  map: YandexMap,
  geocodedPoints: OrderMapPoint[],
  routeLines: CourierRouteLine[],
  realRouteLines: YandexCourierRoute[],
  showRouteLines: boolean,
  liveCouriers: LiveCourierMapMarker[],
  onOrderSelect: (orderId: string) => void,
  adjustViewport: boolean,
): YandexGeoObject[] {
  map.geoObjects.removeAll();
  const realRouteByCourierId = new Map(
    realRouteLines.map((route) => [route.courierId, route]),
  );

  if (showRouteLines) {
    for (const routeLine of routeLines) {
      if (routeLine.points.length < 2) {
        continue;
      }

      const polylineShape = resolveRoutePolyline(routeLine, realRouteByCourierId);

      if (polylineShape.coordinates.length < 2) {
        continue;
      }

      const polyline = new ymaps.Polyline(
        polylineShape.coordinates,
        {},
        {
          strokeColor: routeLine.color,
          strokeWidth: polylineShape.strokeWidth,
          strokeOpacity: polylineShape.strokeOpacity,
        },
      );

      map.geoObjects.add(polyline);
    }
  }

  for (const point of geocodedPoints) {
    const coordinates = point.coordinates;
    if (!coordinates) {
      continue;
    }

    const placemark = new ymaps.Placemark(
      [coordinates.latitude, coordinates.longitude],
      {
        hintContent: `${point.orderId} · ${point.customer}`,
        balloonContentHeader: point.orderId,
        balloonContentBody: buildBalloonBody(point),
      },
      {
        preset: "islands#circleIcon",
        iconColor: getCourierMapColor(point.courierId),
      },
    );

    placemark.events.add("click", () => {
      placemark.balloon.open();
      onOrderSelect(point.orderId);
    });

    map.geoObjects.add(placemark);
  }

  const liveCourierPlacemarks = replaceLiveCourierPlacemarksOnYandexMap(
    ymaps,
    map,
    liveCouriers,
    [],
  );

  if (adjustViewport) {
    if (geocodedPoints.length === 1) {
      const coordinates = geocodedPoints[0]?.coordinates;
      if (coordinates) {
        map.setCenter([coordinates.latitude, coordinates.longitude], 14);
        return liveCourierPlacemarks;
      }
    }

    if (geocodedPoints.length > 0) {
      const bounds = map.geoObjects.getBounds();
      if (bounds) {
        map.setBounds(bounds, {
          checkZoomRange: true,
          zoomMargin: 48,
        });
        return liveCourierPlacemarks;
      }
    }

    map.setCenter(MOSCOW_CENTER, DEFAULT_ZOOM);
  }

  return liveCourierPlacemarks;
}

export function YandexMapPreview({
  geocodedPoints,
  routeLines = [],
  realRouteLines = [],
  showRouteLines = false,
  liveCouriers = [],
  onOrderSelect,
}: YandexMapPreviewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<YandexMap | null>(null);
  const ymapsApiRef = useRef<YandexMapsApi | null>(null);
  const liveCourierPlacemarksRef = useRef<YandexGeoObject[]>([]);
  const onOrderSelectRef = useRef(onOrderSelect);
  const geocodedPointsRef = useRef(geocodedPoints);
  const routeLinesRef = useRef(routeLines);
  const realRouteLinesRef = useRef(realRouteLines);
  const showRouteLinesRef = useRef(showRouteLines);
  const liveCouriersRef = useRef(liveCouriers);

  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    onOrderSelectRef.current = onOrderSelect;
  }, [onOrderSelect]);

  useEffect(() => {
    geocodedPointsRef.current = geocodedPoints;
    routeLinesRef.current = routeLines;
    realRouteLinesRef.current = realRouteLines;
    showRouteLinesRef.current = showRouteLines;
    liveCouriersRef.current = liveCouriers;
  }, [geocodedPoints, liveCouriers, realRouteLines, routeLines, showRouteLines]);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) {
      return;
    }

    let isDisposed = false;

    void loadConfiguredYandexMapsSdk()
      .then((ymaps) => {
        if (isDisposed) {
          return;
        }

        if (mapInstanceRef.current) {
          mapInstanceRef.current.destroy();
          mapInstanceRef.current = null;
        }

        ymapsApiRef.current = ymaps;

        const map = new ymaps.Map(
          container,
          {
            center: MOSCOW_CENTER,
            zoom: DEFAULT_ZOOM,
            controls: ["zoomControl"],
          },
          {
            suppressMapOpenBlock: true,
          },
        );

        mapInstanceRef.current = map;
        liveCourierPlacemarksRef.current = syncMapGeoObjects(
          ymaps,
          map,
          geocodedPointsRef.current,
          routeLinesRef.current,
          realRouteLinesRef.current,
          showRouteLinesRef.current,
          liveCouriersRef.current,
          (orderId) => onOrderSelectRef.current(orderId),
          true,
        );

        setLoadState("ready");
      })
      .catch((error: unknown) => {
        if (isDisposed) {
          return;
        }

        setLoadState("error");
        setLoadError(
          error instanceof Error
            ? error.message
            : "Failed to initialize Yandex map preview.",
        );
      });

    return () => {
      isDisposed = true;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }

      ymapsApiRef.current = null;
      liveCourierPlacemarksRef.current = [];
    };
  }, []);

  useEffect(() => {
    const ymaps = ymapsApiRef.current;
    const map = mapInstanceRef.current;

    if (!ymaps || !map || loadState !== "ready") {
      return;
    }

    liveCourierPlacemarksRef.current = syncMapGeoObjects(
      ymaps,
      map,
      geocodedPoints,
      routeLines,
      realRouteLines,
      showRouteLines,
      liveCouriersRef.current,
      (orderId) => onOrderSelectRef.current(orderId),
      true,
    );
  }, [geocodedPoints, loadState, realRouteLines, routeLines, showRouteLines]);

  useEffect(() => {
    const ymaps = ymapsApiRef.current;
    const map = mapInstanceRef.current;

    if (!ymaps || !map || loadState !== "ready") {
      return;
    }

    liveCourierPlacemarksRef.current = replaceLiveCourierPlacemarksOnYandexMap(
      ymaps,
      map,
      liveCouriers,
      liveCourierPlacemarksRef.current,
    );
  }, [liveCouriers, loadState]);

  return (
    <div className={styles.yandexMapShell}>
      {/* ==================================================
SECTION: MAP
РАЗДЕЛ: Контейнер карты Yandex
Purpose (EN): Yandex map canvas container
Назначение (RU): Контейнер карты Yandex
================================================== */}
      <div
        ref={mapContainerRef}
        className={styles.yandexMapContainer}
        aria-label="Yandex delivery map preview"
      />

      {loadState === "loading" ? (
        <div className={styles.yandexMapOverlay} role="status">
          Loading Yandex map…
        </div>
      ) : null}

      {loadState === "error" ? (
        <div className={`${styles.yandexMapOverlay} ${styles.yandexMapError}`} role="alert">
          {loadError ?? "Unable to load Yandex map preview."}
        </div>
      ) : null}

      {loadState === "ready" && geocodedPoints.length === 0 ? (
        <div className={styles.yandexMapOverlay} role="status">
          No geocoded delivery coordinates yet
        </div>
      ) : null}
    </div>
  );
}
