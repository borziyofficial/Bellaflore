// ==================================================
// SECTION: CHECKOUT
// РАЗДЕЛ: Карта доставки в checkout (lazy reveal)
// ==================================================
"use client";

import type { LiveAddressPreview } from "@/components/addressIntelligence/liveAddressPreviewTypes";
import { getBellafloreMapPinPlacemarkOptions } from "@/components/maps/bellafloreMapPinIcon";
import {
  getCheckoutDeliveryZoneName,
  isCheckoutDeliveryZoneResolved,
} from "@/components/deliveryZones/deliveryZoneCheckoutLabels";
import {
  DELIVERY_ZONES_CATALOG,
  getDeliveryZoneCatalogEntry,
} from "@/components/deliveryZones/deliveryZoneConfig";
import type { RealDeliveryZoneResult } from "@/components/deliveryZones/realDeliveryZoneTypes";
import { loadConfiguredYandexMapsSdkWithoutSuggest } from "@/components/maps/loadYandexMapsSdk";
import { geocodeAddressYandex } from "@/components/maps/yandexGeocoder";
import {
  parseYandexMapClickCoordinates,
  reverseGeocodeFromCoordinates,
} from "@/components/maps/reverseGeocodeFoundation";
import styles from "@/components/checkout/CheckoutMapPanel.module.css";
import { useEffect, useRef, useState } from "react";
import type {
  YandexMap,
  YandexMapsApi,
  YandexPlacemark,
} from "@/components/maps/yandexMapsApi.types";

type CheckoutMapPanelProps = {
  result: RealDeliveryZoneResult;
  formatPrice: (priceRub: number) => string;
  liveAddressPreview?: LiveAddressPreview | null;
  isPanelOpen?: boolean;
  showDeliveryContext?: boolean;
  onMapPointSelect?: (point: CheckoutMapPointSelection) => void;
};

export type CheckoutMapPointSelection = {
  latitude: number;
  longitude: number;
  address: string;
  label: string;
};

type CheckoutYandexMapMarker = {
  latitude: number;
  longitude: number;
  label: string;
  kind: "default" | "selected";
};

type CheckoutYandexMapProps = {
  markers: CheckoutYandexMapMarker[];
  center: [number, number];
  zoom: number;
  onMapClick: (coords: { latitude: number; longitude: number }) => void;
};

const BELLAFLORE_DEFAULT_ADDRESS = "Проспект Мира 76, Москва";
const BELLAFLORE_MARKER_LABEL = "💎 BellaFlore";
const BELLAFLORE_MARKER_BALLOON_BODY = [
  "Главный магазин",
  "Проспект Мира, 76",
  "",
  "Отсюда рассчитывается доставка.",
].join("<br/>");
const MOSCOW_CENTER: [number, number] = [55.7558, 37.6173];
const DEFAULT_ZOOM = 11;
const MARKER_ZOOM = 15;

function resolveRussianMapError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Карта временно недоступна";
  }

  const message = error.message.toLowerCase();

  if (
    message.includes("api key") ||
    message.includes("недоступна") ||
    message.includes("not configured")
  ) {
    return "Карта временно недоступна";
  }

  return error.message.includes("Карта")
    ? error.message
    : "Карта временно недоступна";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function CheckoutYandexMap({
  markers,
  center,
  zoom,
  onMapClick,
}: CheckoutYandexMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<YandexMap | null>(null);
  const ymapsRef = useRef<YandexMapsApi | null>(null);
  const placemarkRefs = useRef<YandexPlacemark[]>([]);
  const onMapClickRef = useRef(onMapClick);
  const centerRef = useRef(center);
  const zoomRef = useRef(zoom);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    centerRef.current = center;
    zoomRef.current = zoom;
  }, [center, zoom]);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) {
      return;
    }

    let isDisposed = false;
    setLoadState("loading");
    setLoadError(null);

    void loadConfiguredYandexMapsSdkWithoutSuggest()
      .then((ymaps) => {
        if (isDisposed) {
          return;
        }

        try {
          container.replaceChildren();
          ymapsRef.current = ymaps;

          const map = new ymaps.Map(
            container,
            {
              center: centerRef.current,
              zoom: zoomRef.current,
              controls: ["zoomControl"],
            },
            {
              suppressMapOpenBlock: true,
            },
          );

          mapInstanceRef.current = map;
          const clickHandler = (event: { get: (key: string) => unknown }) => {
            const target = event.get("target");
            if (target && target !== map) {
              return;
            }

            const coords = parseYandexMapClickCoordinates(event.get("coords"));
            if (coords) {
              onMapClickRef.current(coords);
            }
          };
          map.events.add("click", clickHandler);
          setLoadState("ready");

          requestAnimationFrame(() => {
            map.container?.fitToViewport();
          });
        } catch (error) {
          if (!isDisposed) {
            setLoadState("error");
            setLoadError(resolveRussianMapError(error));
          }
        }
      })
      .catch((error: unknown) => {
        if (!isDisposed) {
          setLoadState("error");
          setLoadError(resolveRussianMapError(error));
        }
      });

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            mapInstanceRef.current?.container?.fitToViewport();
          })
        : null;
    resizeObserver?.observe(container);

    const fitTimers = [120, 420, 900].map((delayMs) =>
      window.setTimeout(() => {
        mapInstanceRef.current?.container?.fitToViewport();
      }, delayMs),
    );

    return () => {
      isDisposed = true;
      resizeObserver?.disconnect();
      fitTimers.forEach((timerId) => window.clearTimeout(timerId));

      placemarkRefs.current = [];
      ymapsRef.current = null;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }

      container.replaceChildren();
    };
  }, []);

  useEffect(() => {
    const ymaps = ymapsRef.current;
    const map = mapInstanceRef.current;

    if (!ymaps || !map || loadState !== "ready") {
      return;
    }

    placemarkRefs.current.forEach((placemark) => {
      map.geoObjects.remove(placemark);
    });
    placemarkRefs.current = [];

    markers.forEach((marker) => {
      const placemark = new ymaps.Placemark(
        [marker.latitude, marker.longitude],
        {
          hintContent: marker.label,
          balloonContentHeader:
            marker.kind === "default"
              ? BELLAFLORE_MARKER_LABEL
              : "Выбранная точка",
          balloonContentBody:
            marker.kind === "default"
              ? BELLAFLORE_MARKER_BALLOON_BODY
              : escapeHtml(marker.label),
        },
        marker.kind === "default"
          ? getBellafloreMapPinPlacemarkOptions()
          : {
              preset: "islands#redDotIcon",
            },
      );

      map.geoObjects.add(placemark);
      if (marker.kind === "default") {
        placemark.events.add("click", () => {
          placemark.balloon.open();
        });
        window.setTimeout(() => {
          placemark.balloon.open();
        }, 0);
      }
      placemarkRefs.current.push(placemark);
    });

    map.setCenter(center, zoom);
    map.container?.fitToViewport();
  }, [center, loadState, markers, zoom]);

  return (
    <div className={styles.yandexMapFrame}>
      <div
        ref={mapContainerRef}
        className={styles.yandexMapContainer}
        aria-label="Карта доставки Yandex Maps"
      />
      {loadState === "loading" ? (
        <div className={styles.yandexMapOverlay} role="status">
          Загрузка карты...
        </div>
      ) : null}
      {loadState === "error" ? (
        <div
          className={`${styles.yandexMapOverlay} ${styles.yandexMapError}`}
          role="alert"
        >
          <p className={styles.mapErrorTitle}>
            {loadError ?? "Карта временно недоступна"}
          </p>
          <p className={styles.mapErrorHint}>
            Введите адрес вручную — мы уточним доставку.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function CheckoutMapPanel({
  result,
  formatPrice,
  liveAddressPreview = null,
  isPanelOpen = true,
  showDeliveryContext = true,
  onMapPointSelect,
}: CheckoutMapPanelProps) {
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const [mapMountReady, setMapMountReady] = useState(false);
  const [defaultPoint, setDefaultPoint] =
    useState<CheckoutMapPointSelection | null>(null);
  const showMap = isPanelOpen && mapMountReady;

  const zoneResultMarker =
    result.latitude !== null && result.longitude !== null
      ? {
          latitude: result.latitude,
          longitude: result.longitude,
          label: result.address,
          kind: "selected" as const,
        }
      : null;
  const livePreviewMarker =
    liveAddressPreview?.hasCoordinates &&
    liveAddressPreview.latitude !== null &&
    liveAddressPreview.longitude !== null
      ? {
          latitude: liveAddressPreview.latitude,
          longitude: liveAddressPreview.longitude,
          label: liveAddressPreview.selectedAddress,
          kind: "selected" as const,
        }
      : null;
  const selectedMarker =
    livePreviewMarker ?? zoneResultMarker ?? null;
  const bellafloreMarker =
    defaultPoint ??
    ({
      latitude: MOSCOW_CENTER[0],
      longitude: MOSCOW_CENTER[1],
      address: BELLAFLORE_DEFAULT_ADDRESS,
      label: BELLAFLORE_MARKER_LABEL,
    } as CheckoutMapPointSelection);

  const markers: CheckoutYandexMapMarker[] = [
    {
      latitude: bellafloreMarker.latitude,
      longitude: bellafloreMarker.longitude,
      label: bellafloreMarker.label,
      kind: "default",
    },
  ];

  if (
    selectedMarker &&
    !(
      selectedMarker.latitude === bellafloreMarker.latitude &&
      selectedMarker.longitude === bellafloreMarker.longitude &&
      selectedMarker.label === bellafloreMarker.label
    )
  ) {
    markers.push({
      latitude: selectedMarker.latitude,
      longitude: selectedMarker.longitude,
      label: selectedMarker.label,
      kind: "selected",
    });
  }

  const selectedZone = result.selectedZoneId
    ? getDeliveryZoneCatalogEntry(result.selectedZoneId)
    : null;

  const zoneBands = DELIVERY_ZONES_CATALOG.filter((zone) => zone.isActive);

  useEffect(() => {
    if (!isPanelOpen) {
      return;
    }

    let cancelled = false;

    void geocodeAddressYandex(BELLAFLORE_DEFAULT_ADDRESS).then((result) => {
      if (cancelled) {
        return;
      }

      if (
        result.status === "found" &&
        result.latitude !== null &&
        result.longitude !== null
      ) {
        setDefaultPoint({
          latitude: result.latitude,
          longitude: result.longitude,
          address: result.address ?? BELLAFLORE_DEFAULT_ADDRESS,
          label: BELLAFLORE_MARKER_LABEL,
        });
        return;
      }

      setDefaultPoint({
        latitude: MOSCOW_CENTER[0],
        longitude: MOSCOW_CENTER[1],
        address: BELLAFLORE_DEFAULT_ADDRESS,
        label: BELLAFLORE_MARKER_LABEL,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [isPanelOpen]);

  useEffect(() => {
    if (!isPanelOpen) {
      return;
    }

    let cancelled = false;

    const tryEnableMapMount = () => {
      if (cancelled) {
        return;
      }

      const rect = mapHostRef.current?.getBoundingClientRect();
      if (rect && rect.height >= 120) {
        setMapMountReady(true);
      }
    };

    const frameId = requestAnimationFrame(() => {
      requestAnimationFrame(tryEnableMapMount);
    });

    const fallbackTimer = window.setTimeout(tryEnableMapMount, 420);
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(tryEnableMapMount)
        : null;
    const host = mapHostRef.current;
    if (host) {
      resizeObserver?.observe(host);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      window.clearTimeout(fallbackTimer);
      resizeObserver?.disconnect();
    };
  }, [isPanelOpen]);

  const handleMapPointClick = async (coords: {
    latitude: number;
    longitude: number;
  }) => {
    const reverseResult = await reverseGeocodeFromCoordinates(
      coords.latitude,
      coords.longitude,
    );

    if (
      reverseResult.status !== "found" ||
      !reverseResult.address?.trim()
    ) {
      return;
    }

    const point: CheckoutMapPointSelection = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      address: reverseResult.address.trim(),
      label: reverseResult.address.trim(),
    };

    onMapPointSelect?.(point);
  };

  if (!isPanelOpen) {
    return null;
  }

  return (
    <div className={styles.mapHost} ref={mapHostRef}>
      {liveAddressPreview?.previewStatus === "selected" &&
      liveAddressPreview.selectedAddress ? (
        <p className={styles.selectedAddress} role="status" aria-live="polite">
          <span className={styles.selectedAddressLabel}>Адрес выбран:</span>
          <span>{liveAddressPreview.selectedAddress}</span>
        </p>
      ) : null}

      {showMap ? (
        <CheckoutYandexMap
          markers={markers}
          center={[
            defaultPoint?.latitude ?? MOSCOW_CENTER[0],
            defaultPoint?.longitude ?? MOSCOW_CENTER[1],
          ]}
          zoom={defaultPoint ? MARKER_ZOOM : DEFAULT_ZOOM}
          onMapClick={handleMapPointClick}
        />
      ) : (
        <p className={styles.mapLoading} role="status">
          Загрузка карты...
        </p>
      )}

      {showDeliveryContext && selectedZone ? (
        <p className={styles.zoneStatus} role="status">
          {selectedZone.label} · Доставка {formatPrice(selectedZone.priceRub)}
        </p>
      ) : showDeliveryContext && result.address.trim() ? (
        <p className={styles.zoneStatusMuted} role="status">
          {isCheckoutDeliveryZoneResolved(result)
            ? getCheckoutDeliveryZoneName(result)
            : "Определяем зону доставки..."}
        </p>
      ) : null}

      {showDeliveryContext ? (
        <ul className={styles.zoneBands} aria-label="Зоны доставки">
          {zoneBands.map((zone) => (
            <li
              key={zone.zoneId}
              className={
                result.selectedZoneId === zone.zoneId ? styles.zoneBandActive : ""
              }
            >
              <span
                className={styles.zoneBandDot}
                style={{ backgroundColor: zone.color }}
                aria-hidden="true"
              />
              <span className={styles.zoneBandLabel}>
                {zone.isBaseZone ? "Базовая" : `${zone.maxDistanceFromBaseKm} км`}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
