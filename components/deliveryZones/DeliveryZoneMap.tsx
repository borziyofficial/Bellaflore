// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Production Yandex delivery map
// ==================================================
"use client";

import {
  buildDeliveryZoneMapModel,
  formatDeliveryZoneMapDistanceLabel,
} from "@/components/deliveryZones/deliveryZoneMapBuilder";
import { getDeliveryZoneCatalogEntry } from "@/components/deliveryZones/deliveryZoneConfig";
import styles from "@/components/deliveryZones/DeliveryZoneMap.module.css";
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";
import type {
  DeliveryZoneMapLegendItem,
  DeliveryZoneMapMarker,
} from "@/components/deliveryZones/deliveryZoneMapTypes";
import type { RealDeliveryZoneStatus } from "@/components/deliveryZones/realDeliveryZoneTypes";
import { getBellafloreMapPinPlacemarkOptions } from "@/components/maps/bellafloreMapPinIcon";
import { loadConfiguredYandexMapsSdk } from "@/components/maps/loadYandexMapsSdk";
import { getYandexMapsApiKey } from "@/components/maps/mapProviderConfig";
import { isYandexMapsPreviewEnabled } from "@/components/maps/mapProviderRegistry";
import {
  parseYandexMapClickCoordinates,
  reverseGeocodeFromCoordinates,
} from "@/components/maps/reverseGeocodeFoundation";
import type {
  YandexMap,
  YandexMapEvent,
  YandexPlacemark,
  YandexPolygon,
} from "@/components/maps/yandexMapsApi.types";
import { useEffect, useMemo, useRef, useState } from "react";

import { MAP_LOAD_ERROR_MESSAGE, resolveYandexMapUnavailableReason } from "@/components/deliveryZones/deliveryMapMessages";

export type MapPointSelection = {
  address: string;
  latitude: number;
  longitude: number;
};

type DeliveryZoneMapProps = {
  selectedZoneId: DeliveryZoneId | null;
  zoneStatus?: RealDeliveryZoneStatus;
  marker?: DeliveryZoneMapMarker | null;
  formatPrice: (priceRub: number) => string;
  variant?: "checkout" | "admin" | "home";
  onMapPointSelect?: (point: MapPointSelection) => void;
};

type DeliveryZoneMapVariant = NonNullable<DeliveryZoneMapProps["variant"]>;

const CHECKOUT_ADDRESS_MAP_ZOOM = 15;

function resolveMapFrameClass(variant: DeliveryZoneMapVariant): string {
  if (variant === "admin") {
    return styles.adminMapFrame;
  }

  if (variant === "home") {
    return styles.homeMapFrame;
  }

  return styles.checkoutMapFrame;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildZoneBalloonBody(
  item: DeliveryZoneMapLegendItem,
  formatPrice: (priceRub: number) => string,
): string {
  return [
    `<div><strong>${escapeHtml(item.label)}</strong></div>`,
    `<div>${escapeHtml(formatPrice(item.priceRub))}</div>`,
    `<div>${escapeHtml(formatDeliveryZoneMapDistanceLabel(item.maxDistanceFromBaseKm, item.isBaseZone))}</div>`,
  ].join("");
}

function MapLoadError({
  compact = false,
  detail = null,
}: {
  compact?: boolean;
  detail?: string | null;
}) {
  return (
    <div className={compact ? styles.mapLoadErrorWrapCompact : styles.mapLoadErrorWrap}>
      <p
        className={`${styles.mapLoadError} ${compact ? styles.mapLoadErrorCompact : ""}`}
        role="status"
      >
        {MAP_LOAD_ERROR_MESSAGE}
      </p>
      {detail ? (
        <p
          className={`${styles.mapLoadErrorDetail} ${compact ? styles.mapLoadErrorDetailCompact : ""}`}
          role="alert"
        >
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function DeliverySelectionCard({
  address,
  zoneLabel,
  priceLabel,
  estimatedTime,
  inZone,
}: {
  address: string;
  zoneLabel: string | null;
  priceLabel: string | null;
  estimatedTime: string | null;
  inZone: boolean;
}) {
  return (
    <div className={styles.deliverySelectionCard} role="status">
      <div
        className={`${styles.deliverySelectionCardHeader} ${
          inZone
            ? styles.deliverySelectionCardHeaderOk
            : styles.deliverySelectionCardHeaderWarn
        }`}
      >
        <span className={styles.deliverySelectionCheck} aria-hidden="true">
          ✓
        </span>
        <span>
          {inZone ? "Адрес в зоне доставки" : "Адрес вне зоны доставки"}
        </span>
      </div>
      <dl className={styles.deliverySelectionRows}>
        <div className={styles.deliverySelectionRow}>
          <dt>Адрес</dt>
          <dd>{address}</dd>
        </div>
        {zoneLabel ? (
          <div className={styles.deliverySelectionRow}>
            <dt>Зона</dt>
            <dd>{zoneLabel}</dd>
          </div>
        ) : null}
        {priceLabel ? (
          <div className={styles.deliverySelectionRow}>
            <dt>Стоимость</dt>
            <dd>{priceLabel}</dd>
          </div>
        ) : null}
        {estimatedTime ? (
          <div className={styles.deliverySelectionRow}>
            <dt>Время</dt>
            <dd>{estimatedTime}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function buildSelectionCardProps(
  selectedZoneId: DeliveryZoneId | null,
  marker: DeliveryZoneMapMarker | null,
  legend: DeliveryZoneMapLegendItem[],
  formatPrice: (priceRub: number) => string,
) {
  if (!marker || !selectedZoneId) {
    return null;
  }

  const legendItem = legend.find((item) => item.zoneId === selectedZoneId);
  const catalogEntry = getDeliveryZoneCatalogEntry(selectedZoneId);

  if (!legendItem) {
    return null;
  }

  return {
    address: marker.label,
    zoneLabel: legendItem.label,
    priceLabel: formatPrice(legendItem.priceRub),
    estimatedTime: catalogEntry?.estimatedTime ?? null,
    inZone: true,
  };
}

function YandexDeliveryZoneMap({
  selectedZoneId,
  zoneStatus,
  marker,
  formatPrice,
  variant = "admin",
  onMapPointSelect,
}: DeliveryZoneMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<YandexMap | null>(null);
  const ymapsRef = useRef<Awaited<
    ReturnType<typeof loadConfiguredYandexMapsSdk>
  > | null>(null);
  const polygonRefsRef = useRef<YandexPolygon[]>([]);
  const placemarkRef = useRef<YandexPlacemark | null>(null);
  const onMapPointSelectRef = useRef(onMapPointSelect);
  const formatPriceRef = useRef(formatPrice);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadErrorDetail, setLoadErrorDetail] = useState<string | null>(null);
  const mapVariant = variant ?? "admin";
  const isCheckout = mapVariant === "checkout";

  const model = useMemo(
    () =>
      buildDeliveryZoneMapModel({
        selectedZoneId,
        zoneStatus,
        marker: marker ?? null,
        usesYandexMap: true,
      }),
    [marker, selectedZoneId, zoneStatus],
  );

  const selectionCardProps = buildSelectionCardProps(
    selectedZoneId,
    marker ?? null,
    model.legend,
    formatPrice,
  );

  useEffect(() => {
    onMapPointSelectRef.current = onMapPointSelect;
  }, [onMapPointSelect]);

  useEffect(() => {
    formatPriceRef.current = formatPrice;
  }, [formatPrice]);

  const handleMapSelectionClickRef = useRef((event: YandexMapEvent) => {
    const parsed = parseYandexMapClickCoordinates(event.get("coords"));
    const selectPoint = onMapPointSelectRef.current;
    if (!parsed || !selectPoint) {
      return;
    }

    void reverseGeocodeFromCoordinates(
      parsed.latitude,
      parsed.longitude,
    ).then((result) => {
      if (result.status !== "found" || !result.address) {
        return;
      }

      selectPoint({
        address: result.address,
        latitude: result.latitude,
        longitude: result.longitude,
      });
    });
  });

  useEffect(() => {
    handleMapSelectionClickRef.current = (event: YandexMapEvent) => {
      const parsed = parseYandexMapClickCoordinates(event.get("coords"));
      const selectPoint = onMapPointSelectRef.current;
      if (!parsed || !selectPoint) {
        return;
      }

      void reverseGeocodeFromCoordinates(
        parsed.latitude,
        parsed.longitude,
      ).then((result) => {
        if (result.status !== "found" || !result.address) {
          return;
        }

        selectPoint({
          address: result.address,
          latitude: result.latitude,
          longitude: result.longitude,
        });
      });
    };
  }, []);

  const initialBoundsModel = useMemo(
    () =>
      buildDeliveryZoneMapModel({
        selectedZoneId: null,
        zoneStatus: "unknown",
        marker: null,
        usesYandexMap: true,
      }),
    [],
  );

  useEffect(() => {
    const container = mapContainerRef.current;

    if (!container) {
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

          ymapsRef.current = ymaps;
          container.replaceChildren();

          const map = new ymaps.Map(
            container,
            {
              center: [
                initialBoundsModel.center.latitude,
                initialBoundsModel.center.longitude,
              ],
              zoom: initialBoundsModel.defaultZoom,
              controls: ["zoomControl"],
            },
            { suppressMapOpenBlock: true },
          );

          mapInstanceRef.current = map;

          map.events.add("click", (event) => {
            handleMapSelectionClickRef.current(event);
          });

          setLoadState("ready");
          requestAnimationFrame(() => {
            map.container?.fitToViewport();
          });
        } catch (error) {
          if (!isDisposed) {
            setLoadErrorDetail(
              error instanceof Error
                ? error.message
                : "Yandex Maps SDK initialization failed.",
            );
            setLoadState("error");
          }
        }
      })
      .catch((error) => {
        if (!isDisposed) {
          setLoadErrorDetail(
            error instanceof Error
              ? error.message
              : "Failed to load Yandex Maps SDK.",
          );
          setLoadState("error");
        }
      });

    const resizeObserver = new ResizeObserver(() => {
      mapInstanceRef.current?.container?.fitToViewport();
    });
    resizeObserver.observe(container);

    return () => {
      isDisposed = true;
      resizeObserver.disconnect();
      polygonRefsRef.current = [];
      placemarkRef.current = null;
      ymapsRef.current = null;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }

      container.replaceChildren();
    };
  }, [initialBoundsModel]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const ymaps = ymapsRef.current;

    if (!map || !ymaps || loadState !== "ready") {
      return;
    }

    const allowAddressPickOnZones =
      mapVariant === "home" || mapVariant === "checkout";

    for (const polygon of polygonRefsRef.current) {
      map.geoObjects.remove(polygon);
    }
    polygonRefsRef.current = [];

    for (const layer of model.layers) {
      const rings = layer.ringCoordinates.map((ring) =>
        ring.map(
          (point) => [point.latitude, point.longitude] as [number, number],
        ),
      );
      const legendItem = model.legend.find(
        (item) => item.zoneId === layer.zoneId,
      );

      if (!legendItem) {
        continue;
      }

      const polygon = new ymaps.Polygon(
        rings,
        allowAddressPickOnZones
          ? { hintContent: legendItem.label }
          : {
              hintContent: legendItem.label,
              balloonContentHeader: legendItem.label,
              balloonContentBody: buildZoneBalloonBody(
                legendItem,
                formatPriceRef.current,
              ),
            },
        {
          fillColor: layer.color,
          strokeColor: layer.borderColor,
          fillOpacity: layer.fillOpacity,
          strokeOpacity: layer.strokeOpacity,
          strokeWidth: layer.strokeWidth,
          zIndex: layer.sortOrder,
          openBalloonOnClick: !allowAddressPickOnZones,
        },
      );

      if (allowAddressPickOnZones) {
        polygon.events.add("click", (event) => {
          handleMapSelectionClickRef.current(event as YandexMapEvent);
        });
      }

      map.geoObjects.add(polygon);
      polygonRefsRef.current.push(polygon);
    }
  }, [loadState, mapVariant, model.layers, model.legend]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const ymaps = ymapsRef.current;

    if (!map || !ymaps || loadState !== "ready") {
      return;
    }

    if (placemarkRef.current) {
      map.geoObjects.remove(placemarkRef.current);
      placemarkRef.current = null;
    }

    if (!model.marker) {
      return;
    }

    const placemark = new ymaps.Placemark(
      [model.marker.latitude, model.marker.longitude],
      {
        hintContent: model.marker.label,
        balloonContentHeader: "Адрес доставки",
        balloonContentBody: escapeHtml(model.marker.label),
      },
      getBellafloreMapPinPlacemarkOptions(),
    );

    map.geoObjects.add(placemark);
    placemarkRef.current = placemark;
    map.setCenter(
      [model.marker.latitude, model.marker.longitude],
      isCheckout ? CHECKOUT_ADDRESS_MAP_ZOOM : model.defaultZoom,
    );
  }, [isCheckout, loadState, model.defaultZoom, model.marker]);

  useEffect(() => {
    if (loadState !== "ready") {
      return;
    }

    const map = mapInstanceRef.current;
    if (!map) {
      return;
    }

    const fitTimers = [0, 120, 420, 900].map((delayMs) =>
      window.setTimeout(() => {
        map.container?.fitToViewport();
      }, delayMs),
    );

    return () => {
      fitTimers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [loadState, mapVariant]);

  const showSelectionCard =
    mapVariant !== "home" && selectionCardProps !== null;

  return (
    <div
      className={`${styles.deliveryZoneMapShell} ${
        isCheckout ? styles.deliveryZoneMapShellCheckout : ""
      }`}
    >
      <div
        className={`${styles.deliveryZoneMapFrame} ${resolveMapFrameClass(mapVariant)}`}
      >
        <div className={styles.yandexMapContainer} ref={mapContainerRef} />
        {loadState === "loading" ? (
          <div className={styles.yandexMapOverlay} aria-hidden="true">
            <p className={styles.mapLoadErrorCompact} role="status">
              Загрузка карты...
            </p>
          </div>
        ) : null}
        {loadState === "error" ? (
          <div className={`${styles.yandexMapOverlay} ${styles.yandexMapOverlayError}`}>
            <MapLoadError compact={isCheckout} detail={loadErrorDetail} />
          </div>
        ) : null}
      </div>

      {showSelectionCard ? (
        <DeliverySelectionCard {...selectionCardProps} />
      ) : null}
    </div>
  );
}

export function DeliveryMapVisibilityToggle({
  isVisible,
  onShow,
  onHide,
}: {
  isVisible: boolean;
  onShow: () => void;
  onHide: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.mapExpandRow}
      aria-expanded={isVisible}
      onClick={isVisible ? onHide : onShow}
    >
      <span className={styles.mapExpandIcon} aria-hidden="true">
        {isVisible ? "−" : "+"}
      </span>
    </button>
  );
}

function canMountYandexMap(): boolean {
  return isYandexMapsPreviewEnabled() && Boolean(getYandexMapsApiKey());
}

export function DeliveryZoneMap(props: DeliveryZoneMapProps) {
  const isCheckoutVariant = props.variant === "checkout";

  if (!canMountYandexMap()) {
    return (
      <MapLoadError
        compact={isCheckoutVariant}
        detail={resolveYandexMapUnavailableReason()}
      />
    );
  }

  const variant = props.variant ?? "admin";

  if (variant === "home") {
    return <YandexDeliveryZoneMap {...props} variant="home" />;
  }

  if (variant === "checkout") {
    return (
      <div
        className={`${styles.deliveryZoneMapShell} ${styles.deliveryZoneMapShellCheckout}`}
      >
        <YandexDeliveryZoneMap {...props} variant="checkout" />
      </div>
    );
  }

  return <YandexDeliveryZoneMap {...props} variant={variant} />;
}
