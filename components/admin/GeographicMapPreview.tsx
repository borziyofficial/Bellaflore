// ==================================================
// SECTION: MAP
// РАЗДЕЛ: Карта
//
// Purpose (EN):
// Geographic map preview for admin planning
//
// Назначение (RU):
// Географическое превью карты для планирования
// ==================================================
"use client";

import styles from "@/components/admin/GeographicMapPreview.module.css";
import type { AdminOrderRecord } from "@/components/admin/adminOrderList";
import { buildRoutePlanningPlan } from "@/components/admin/adminRoutePlanning";
import {
  COURIER_MAP_LEGEND,
  getCourierMapColor,
} from "@/components/maps/courierMapColors";
import { buildRouteDistancePlan } from "@/components/maps/routeDistancePlanner";
import {
  buildCourierRouteLines,
  filterCourierRouteLines,
} from "@/components/maps/routeLineBuilder";
import {
  getRouteLineStatusLabel,
  type RouteLineCourierFilter,
} from "@/components/maps/routeLineTypes";
import { buildRoadRoutesForRouteLines } from "@/components/maps/yandexRouteActions";
import {
  formatRouteDistanceMeters,
  formatRouteDurationSeconds,
  getYandexRouteStatusLabel,
  type YandexCourierRoute,
} from "@/components/maps/yandexRoutingTypes";
import {
  buildMapsFoundationData,
  getGeocodedMapPoints,
  getGeocodingResultStatusClassSuffix,
  getGeocodingResultStatusLabel,
  getNeedsGeocodingMapPoints,
  type GeocodingOverrides,
  type OrderMapPoint,
} from "@/components/maps/orderMapData";
import { isYandexMapsPreviewEnabled } from "@/components/maps/mapProviderRegistry";
import { YandexMapPreview } from "@/components/maps/YandexMapPreview";
import { TrafficEtaAssistant } from "@/components/admin/TrafficEtaAssistant";
import { LiveRouteMonitoringPanel } from "@/components/admin/LiveRouteMonitoringPanel";
import { SmartReroutePanel } from "@/components/admin/SmartReroutePanel";
import {
  LiveCourierMapSummary,
  LiveCourierMarkerPopup,
  LiveCourierRefreshControls,
  LiveCourierSvgMarkers,
} from "@/components/admin/LiveCourierMap";
import { buildLiveRouteMonitoringData } from "@/components/couriers/liveRouteMonitor";
import {
  applyAssistedRouteOverridesToRouteLines,
  getAssistedRouteOverrides,
} from "@/components/dispatch/assistedRouteOverrideStorage";
import { buildSmartRerouteSuggestions } from "@/components/dispatch/smartRerouteAssistant";
import {
  LIVE_COURIER_UPDATE_CONFIG,
  type LiveCourierRefreshIntervalMs,
} from "@/components/couriers/liveCourierUpdateConfig";
import { useLiveCourierLocations } from "@/components/couriers/useLiveCourierLocations";
import { getOrderStatusLabel } from "@/components/orders/orderStatus";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

type GeographicMapPreviewProps = {
  orders: AdminOrderRecord[];
  geocodingOverrides: GeocodingOverrides;
  onOrderSelect: (orderId: string) => void;
};

const MAP_WIDTH = 800;
const MAP_HEIGHT = 480;
const MAP_PADDING = 48;
const MIN_SCALE = 0.6;
const MAX_SCALE = 3.5;

type MapBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

type MapView = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

const DEFAULT_MOSCOW_BOUNDS: MapBounds = {
  minLat: 55.65,
  maxLat: 55.85,
  minLng: 37.45,
  maxLng: 37.75,
};

function computeMapBounds(points: OrderMapPoint[]): MapBounds {
  const geocodedPoints = getGeocodedMapPoints(points);

  if (geocodedPoints.length === 0) {
    return DEFAULT_MOSCOW_BOUNDS;
  }

  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let minLng = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;

  for (const point of geocodedPoints) {
    const coordinates = point.coordinates;
    if (!coordinates) {
      continue;
    }

    minLat = Math.min(minLat, coordinates.latitude);
    maxLat = Math.max(maxLat, coordinates.latitude);
    minLng = Math.min(minLng, coordinates.longitude);
    maxLng = Math.max(maxLng, coordinates.longitude);
  }

  const latitudePadding = (maxLat - minLat) * 0.18 || 0.02;
  const longitudePadding = (maxLng - minLng) * 0.18 || 0.02;

  return {
    minLat: minLat - latitudePadding,
    maxLat: maxLat + latitudePadding,
    minLng: minLng - longitudePadding,
    maxLng: maxLng + longitudePadding,
  };
}

function projectCoordinates(
  latitude: number,
  longitude: number,
  bounds: MapBounds,
): { x: number; y: number } {
  const latitudeRange = bounds.maxLat - bounds.minLat || 0.01;
  const longitudeRange = bounds.maxLng - bounds.minLng || 0.01;

  return {
    x:
      MAP_PADDING +
      ((longitude - bounds.minLng) / longitudeRange) *
        (MAP_WIDTH - MAP_PADDING * 2),
    y:
      MAP_PADDING +
      ((bounds.maxLat - latitude) / latitudeRange) *
        (MAP_HEIGHT - MAP_PADDING * 2),
  };
}

function getGeocodingResultClass(point: OrderMapPoint): string {
  const suffix = getGeocodingResultStatusClassSuffix(point.geocoding);

  switch (suffix) {
    case "Cached":
      return styles.statusCached;
    case "Found":
      return styles.statusFound;
    case "Pending":
      return styles.statusPending;
    case "Error":
      return styles.statusError;
    case "NotFound":
    default:
      return styles.statusNotFound;
  }
}

function NeedsGeocodingRow({
  point,
  onOrderSelect,
}: {
  point: OrderMapPoint;
  onOrderSelect: (orderId: string) => void;
}) {
  return (
    <li>
      <button
        type="button"
        className={styles.needsGeocodingButton}
        onClick={() => onOrderSelect(point.orderId)}
      >
        <div className={styles.needsGeocodingTop}>
          <strong>{point.orderId}</strong>
          <span
            className={`${styles.statusBadge} ${getGeocodingResultClass(point)}`}
          >
            {getGeocodingResultStatusLabel(point.geocoding)}
          </span>
        </div>
        <span className={styles.needsGeocodingAddress}>{point.address}</span>
      </button>
    </li>
  );
}

export function GeographicMapPreview({
  orders,
  geocodingOverrides,
  onOrderSelect,
}: GeographicMapPreviewProps) {
  const useYandexMap = isYandexMapsPreviewEnabled();
  const mapsData = useMemo(
    () => buildMapsFoundationData(orders, geocodingOverrides),
    [geocodingOverrides, orders],
  );
  const geocodedPoints = useMemo(
    () => getGeocodedMapPoints(mapsData.points),
    [mapsData.points],
  );
  const needsGeocodingPoints = useMemo(
    () => getNeedsGeocodingMapPoints(mapsData.points),
    [mapsData.points],
  );
  const bounds = useMemo(
    () => computeMapBounds(mapsData.points),
    [mapsData.points],
  );
  const routeDistancePlan = useMemo(
    () => buildRouteDistancePlan(orders, geocodingOverrides),
    [geocodingOverrides, orders],
  );
  const routePlanningPlan = useMemo(
    () => buildRoutePlanningPlan(orders),
    [orders],
  );
  const routeLines = useMemo(
    () =>
      buildCourierRouteLines(
        routeDistancePlan.courierPlans,
        mapsData.points,
        routePlanningPlan.courierRoutes,
      ),
    [mapsData.points, routeDistancePlan.courierPlans, routePlanningPlan.courierRoutes],
  );

  const [showRouteLines, setShowRouteLines] = useState(true);
  const [courierFilter, setCourierFilter] =
    useState<RouteLineCourierFilter>("all");
  const [realRouteLines, setRealRouteLines] = useState<
    Record<string, YandexCourierRoute>
  >({});
  const [isBuildingRoadRoutes, setIsBuildingRoadRoutes] = useState(false);
  const [roadRouteNotice, setRoadRouteNotice] = useState("");
  const [roadRouteWarning, setRoadRouteWarning] = useState("");
  const [assistedRouteRevision, setAssistedRouteRevision] = useState(0);

  const assistedRouteOverrides = useMemo(() => {
    void assistedRouteRevision;
    return getAssistedRouteOverrides();
  }, [assistedRouteRevision]);
  const displayRouteLines = useMemo(
    () =>
      applyAssistedRouteOverridesToRouteLines(
        routeLines,
        assistedRouteOverrides,
      ),
    [assistedRouteOverrides, routeLines],
  );

  const filteredRouteLines = useMemo(
    () => filterCourierRouteLines(displayRouteLines, courierFilter),
    [courierFilter, displayRouteLines],
  );
  const visibleRealRoutes = useMemo(
    () =>
      Object.values(realRouteLines).filter((route) =>
        filteredRouteLines.some((line) => line.courierId === route.courierId),
      ),
    [filteredRouteLines, realRouteLines],
  );

  const [mapView, setMapView] = useState<MapView>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(
    null,
  );
  const [selectedLiveCourierId, setSelectedLiveCourierId] = useState<
    string | null
  >(null);
  const [liveCourierAutoRefresh, setLiveCourierAutoRefresh] = useState(true);
  const [liveCourierRefreshIntervalMs, setLiveCourierRefreshIntervalMs] =
    useState<LiveCourierRefreshIntervalMs>(
      LIVE_COURIER_UPDATE_CONFIG.defaultRefreshMs,
    );
  const {
    data: liveCourierMapData,
    lastRefreshedAt: liveCourierLastRefreshedAt,
    refreshNow: refreshLiveCouriersNow,
    isDocumentVisible: isLiveCourierDocumentVisible,
  } = useLiveCourierLocations({
    autoRefreshEnabled: liveCourierAutoRefresh,
    refreshIntervalMs: liveCourierRefreshIntervalMs,
  });
  const liveRouteMonitoringData = useMemo(
    () =>
      buildLiveRouteMonitoringData({
        liveCouriers: liveCourierMapData.visibleCouriers,
        routeLines,
        realRoutes: Object.values(realRouteLines),
        routeDistancePlan,
        geocodedPoints: mapsData.points,
      }),
    [
      liveCourierMapData.visibleCouriers,
      mapsData.points,
      realRouteLines,
      routeDistancePlan,
      routeLines,
    ],
  );
  const smartRerouteData = useMemo(
    () =>
      buildSmartRerouteSuggestions({
        orders,
        routeMonitoring: liveRouteMonitoringData,
        routeLines,
        realRoutes: Object.values(realRouteLines),
        routeDistancePlan,
        routePlanningPlan,
      }),
    [
      liveRouteMonitoringData,
      orders,
      realRouteLines,
      routeDistancePlan,
      routeLines,
      routePlanningPlan,
    ],
  );
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; view: MapView } | null>(
    null,
  );

  const selectedPoint = useMemo(
    () =>
      geocodedPoints.find((point) => point.orderId === selectedMarkerId) ??
      null,
    [geocodedPoints, selectedMarkerId],
  );
  const selectedLiveCourier = useMemo(
    () =>
      liveCourierMapData.visibleCouriers.find(
        (marker) => marker.courierId === selectedLiveCourierId,
      ) ?? null,
    [liveCourierMapData.visibleCouriers, selectedLiveCourierId],
  );

  const markerPositions = useMemo(
    () =>
      geocodedPoints.map((point) => {
        const coordinates = point.coordinates!;
        const position = projectCoordinates(
          coordinates.latitude,
          coordinates.longitude,
          bounds,
        );

        return {
          point,
          position,
          color: getCourierMapColor(point.courierId),
        };
      }),
    [bounds, geocodedPoints],
  );

  const handleMarkerClick = useCallback(
    (orderId: string) => {
      setSelectedLiveCourierId(null);

      if (selectedMarkerId === orderId) {
        onOrderSelect(orderId);
        setSelectedMarkerId(null);
        return;
      }

      setSelectedMarkerId(orderId);
    },
    [onOrderSelect, selectedMarkerId],
  );

  const handleLiveCourierMarkerClick = useCallback(
    (courierId: string) => {
      setSelectedMarkerId(null);
      setSelectedLiveCourierId((currentCourierId) =>
        currentCourierId === courierId ? null : courierId,
      );
    },
    [],
  );

  const handleWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.92 : 1.08;

    setMapView((currentView) => ({
      ...currentView,
      scale: Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, currentView.scale * zoomFactor),
      ),
    }));
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }

      const target = event.target as HTMLElement;
      if (
        target.closest("[data-map-marker]") ||
        target.closest("[data-live-courier-marker]")
      ) {
        return;
      }

      panStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        view: mapView,
      };
      setIsPanning(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [mapView],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const panStart = panStartRef.current;
      if (!panStart) {
        return;
      }

      setMapView({
        ...panStart.view,
        offsetX: panStart.view.offsetX + (event.clientX - panStart.x),
        offsetY: panStart.view.offsetY + (event.clientY - panStart.y),
      });
    },
    [],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      panStartRef.current = null;
      setIsPanning(false);
      event.currentTarget.releasePointerCapture(event.pointerId);
    },
    [],
  );

  const handleZoomIn = useCallback(() => {
    setMapView((currentView) => ({
      ...currentView,
      scale: Math.min(MAX_SCALE, currentView.scale * 1.15),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setMapView((currentView) => ({
      ...currentView,
      scale: Math.max(MIN_SCALE, currentView.scale / 1.15),
    }));
  }, []);

  const handleResetView = useCallback(() => {
    setMapView({ scale: 1, offsetX: 0, offsetY: 0 });
    setSelectedMarkerId(null);
    setSelectedLiveCourierId(null);
  }, []);

  const handleBuildRoadRoutes = useCallback(async () => {
    if (!useYandexMap || isBuildingRoadRoutes) {
      return;
    }

    const buildTargets = filteredRouteLines.filter(
      (line) => line.points.length >= 2,
    );

    if (buildTargets.length === 0) {
      setRoadRouteNotice("");
      setRoadRouteWarning(
        "No visible courier routes with enough geocoded points to build road routes.",
      );
      return;
    }

    setIsBuildingRoadRoutes(true);
    setRoadRouteNotice("");
    setRoadRouteWarning("");

    try {
      const builtRoutes = await buildRoadRoutesForRouteLines(buildTargets);
      setRealRouteLines((currentRoutes) => ({
        ...currentRoutes,
        ...builtRoutes,
      }));

      const builtRouteList = Object.values(builtRoutes);
      const readyCount = builtRouteList.filter(
        (route) => route.status === "ready",
      ).length;
      const fallbackCount = builtRouteList.filter(
        (route) => route.status === "fallback" || route.status === "error",
      ).length;

      setRoadRouteNotice(
        readyCount > 0
          ? `Built ${readyCount} road route${readyCount === 1 ? "" : "s"} for visible couriers.`
          : "No road routes were built for the visible couriers.",
      );

      if (fallbackCount > 0) {
        setRoadRouteWarning(
          `${fallbackCount} courier route${fallbackCount === 1 ? "" : "s"} fell back to straight preview lines.`,
        );
      }
    } catch {
      setRoadRouteWarning(
        "Unable to build road routes right now. Straight preview lines remain available.",
      );
    } finally {
      setIsBuildingRoadRoutes(false);
    }
  }, [filteredRouteLines, isBuildingRoadRoutes, useYandexMap]);

  const getRoadRouteStatusClass = (status: YandexCourierRoute["status"]) => {
    switch (status) {
      case "ready":
        return styles.roadRouteStatusReady;
      case "incomplete":
        return styles.roadRouteStatusIncomplete;
      case "error":
        return styles.roadRouteStatusError;
      case "fallback":
      default:
        return styles.roadRouteStatusFallback;
    }
  };

  return (
    <section className={styles.geographicMapSection}>
      <div className={styles.geographicMapHeader}>
        <h2 className={styles.geographicMapHeading}>Geographic Map Preview</h2>
        <p className={styles.geographicMapMeta}>
          {useYandexMap
            ? "Read-only Yandex map overview of delivery locations. Click a marker to view the balloon and open order details."
            : "Read-only overview of delivery locations. Pan and zoom the map; click a marker for details, then click again to open the order."}
        </p>
      </div>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span>Total Orders</span>
          <strong>{mapsData.summary.totalDeliveryAddresses}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span>Geocoded</span>
          <strong>{mapsData.summary.geocodedCount}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span>Pending</span>
          <strong>{mapsData.summary.pendingCount}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span>Not Found</span>
          <strong>{mapsData.summary.notFoundCount}</strong>
        </article>
      </div>

      <div className={styles.legendRow}>
        {COURIER_MAP_LEGEND.map((entry) => (
          <span key={entry.id} className={styles.legendItem}>
            <span
              className={styles.legendSwatch}
              style={{ backgroundColor: entry.color }}
            />
            {entry.label}
          </span>
        ))}
      </div>

      {useYandexMap ? (
        <div className={styles.routeLinesControls}>
          <label className={styles.routeLinesToggle}>
            <input
              type="checkbox"
              checked={showRouteLines}
              onChange={(event) => setShowRouteLines(event.target.checked)}
            />
            Show route lines
          </label>

          <label className={styles.routeLinesFilter}>
            <span>Courier filter</span>
            <select
              value={courierFilter}
              onChange={(event) =>
                setCourierFilter(event.target.value as RouteLineCourierFilter)
              }
            >
              <option value="all">All couriers</option>
              {COURIER_MAP_LEGEND.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className={styles.buildRoadRoutesButton}
            onClick={() => void handleBuildRoadRoutes()}
            disabled={
              isBuildingRoadRoutes ||
              filteredRouteLines.every((line) => line.points.length < 2)
            }
          >
            {isBuildingRoadRoutes ? "Building road routes…" : "Build road routes"}
          </button>
        </div>
      ) : null}

      {useYandexMap && roadRouteNotice ? (
        <p className={styles.roadRouteNotice} role="status">
          {roadRouteNotice}
        </p>
      ) : null}

      {useYandexMap && roadRouteWarning ? (
        <p className={styles.roadRouteWarning} role="status">
          {roadRouteWarning}
        </p>
      ) : null}

      {useYandexMap ? (
        <div className={styles.routeLinesSummary}>
          <h3 className={styles.routeLinesSummaryHeading}>Route lines</h3>
          {routeLines.length === 0 ? (
            <p className={styles.routeLinesSummaryEmpty}>
              No active courier routes to preview yet.
            </p>
          ) : (
            <ul className={styles.routeLinesSummaryList}>
              {routeLines.map((line) => {
                const roadRoute = realRouteLines[line.courierId];

                return (
                <li key={line.courierId} className={styles.routeLinesSummaryItem}>
                  <div className={styles.routeLinesSummaryTop}>
                    <span
                      className={styles.legendSwatch}
                      style={{ backgroundColor: line.color }}
                    />
                    <strong>{line.courierName}</strong>
                    <span
                      className={`${styles.routeLineStatusBadge} ${
                        line.status === "ready"
                          ? styles.routeLineStatusReady
                          : line.status === "incomplete"
                            ? styles.routeLineStatusIncomplete
                            : styles.routeLineStatusEmpty
                      }`}
                    >
                      Preview: {getRouteLineStatusLabel(line.status)}
                    </span>
                    {roadRoute ? (
                      <span
                        className={`${styles.routeLineStatusBadge} ${getRoadRouteStatusClass(roadRoute.status)}`}
                      >
                        Road route: {getYandexRouteStatusLabel(roadRoute.status)}
                      </span>
                    ) : null}
                    {roadRoute?.fromCache ? (
                      <span
                        className={`${styles.routeLineStatusBadge} ${styles.roadRouteStatusCached}`}
                      >
                        Cached
                      </span>
                    ) : null}
                  </div>
                  <p className={styles.routeLinesSummaryMeta}>
                    {line.points.length} geocoded point
                    {line.points.length === 1 ? "" : "s"}
                    {line.missingCoordinateOrderIds.length > 0
                      ? ` · ${line.missingCoordinateOrderIds.length} missing coordinate${line.missingCoordinateOrderIds.length === 1 ? "" : "s"}`
                      : ""}
                    {roadRoute
                      ? ` · ${formatRouteDistanceMeters(roadRoute.distanceMeters)} · ${formatRouteDurationSeconds(roadRoute.durationSeconds)}`
                      : ""}
                  </p>
                  {roadRoute?.errorMessage &&
                  (roadRoute.status === "fallback" ||
                    roadRoute.status === "error") ? (
                    <p className={styles.routeLinesSummaryWarning}>
                      {roadRoute.errorMessage}
                    </p>
                  ) : null}
                </li>
              );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {useYandexMap ? (
        <TrafficEtaAssistant
          routeLines={filteredRouteLines}
          realRouteLines={realRouteLines}
          routeDistancePlan={routeDistancePlan}
          onRealRouteLinesUpdate={(nextRoutes) => {
            setRealRouteLines((currentRoutes) => ({
              ...currentRoutes,
              ...nextRoutes,
            }));
          }}
        />
      ) : null}

      {useYandexMap ? (
        <YandexMapPreview
          geocodedPoints={geocodedPoints}
          routeLines={filteredRouteLines}
          realRouteLines={visibleRealRoutes}
          showRouteLines={showRouteLines}
          liveCouriers={liveCourierMapData.visibleCouriers}
          onOrderSelect={onOrderSelect}
        />
      ) : (
        <div className={styles.mapShell}>
          <div className={styles.mapControls}>
            <button type="button" onClick={handleZoomIn} aria-label="Zoom in">
              +
            </button>
            <button type="button" onClick={handleZoomOut} aria-label="Zoom out">
              −
            </button>
            <button type="button" onClick={handleResetView}>
              Reset
            </button>
          </div>

          <div
            className={`${styles.mapViewport} ${isPanning ? styles.mapViewportPanning : ""}`}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div
              className={styles.mapTransformLayer}
              style={{
                transform: `translate(${mapView.offsetX}px, ${mapView.offsetY}px) scale(${mapView.scale})`,
              }}
            >
              <svg
                className={styles.mapCanvas}
                viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                role="img"
                aria-label="Delivery locations map preview"
              >
                <rect
                  x="0"
                  y="0"
                  width={MAP_WIDTH}
                  height={MAP_HEIGHT}
                  className={styles.mapBackground}
                />
                <g className={styles.mapGrid}>
                  {Array.from({ length: 8 }).map((_, index) => {
                    const x =
                      MAP_PADDING +
                      (index * (MAP_WIDTH - MAP_PADDING * 2)) / 7;

                    return (
                      <line
                        key={`grid-v-${index}`}
                        x1={x}
                        y1={MAP_PADDING}
                        x2={x}
                        y2={MAP_HEIGHT - MAP_PADDING}
                      />
                    );
                  })}
                  {Array.from({ length: 5 }).map((_, index) => {
                    const y =
                      MAP_PADDING +
                      (index * (MAP_HEIGHT - MAP_PADDING * 2)) / 4;

                    return (
                      <line
                        key={`grid-h-${index}`}
                        x1={MAP_PADDING}
                        y1={y}
                        x2={MAP_WIDTH - MAP_PADDING}
                        y2={y}
                      />
                    );
                  })}
                </g>

                {markerPositions.map(({ point, position, color }) => {
                  const isSelected = selectedMarkerId === point.orderId;

                  return (
                    <g
                      key={point.orderId}
                      data-map-marker
                      className={`${styles.mapMarker} ${isSelected ? styles.mapMarkerSelected : ""}`}
                      transform={`translate(${position.x}, ${position.y})`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleMarkerClick(point.orderId);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleMarkerClick(point.orderId);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Order ${point.orderId}, courier ${point.courier ?? "Unassigned"}`}
                    >
                      <circle r={isSelected ? 11 : 9} fill={color} />
                      <circle
                        r={isSelected ? 16 : 14}
                        className={styles.mapMarkerRing}
                      />
                    </g>
                  );
                })}

                <LiveCourierSvgMarkers
                  markers={liveCourierMapData.visibleCouriers}
                  projectCoordinates={(latitude, longitude) =>
                    projectCoordinates(latitude, longitude, bounds)
                  }
                  selectedCourierId={selectedLiveCourierId}
                  onMarkerClick={handleLiveCourierMarkerClick}
                />
              </svg>
            </div>

            {selectedPoint ? (
              <div className={styles.markerPopup}>
                <p className={styles.markerPopupHint}>
                  Click the marker again to open order details
                </p>
                <dl className={styles.markerPopupList}>
                  <div>
                    <dt>Order ID</dt>
                    <dd>{selectedPoint.orderId}</dd>
                  </div>
                  <div>
                    <dt>Customer</dt>
                    <dd>{selectedPoint.customer}</dd>
                  </div>
                  <div>
                    <dt>Address</dt>
                    <dd>{selectedPoint.address}</dd>
                  </div>
                  <div>
                    <dt>Delivery interval</dt>
                    <dd>{selectedPoint.deliveryInterval}</dd>
                  </div>
                  <div>
                    <dt>Courier</dt>
                    <dd>{selectedPoint.courier ?? "Unassigned"}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{getOrderStatusLabel(selectedPoint.status)}</dd>
                  </div>
                </dl>
              </div>
            ) : null}

            {selectedLiveCourier ? (
              <LiveCourierMarkerPopup marker={selectedLiveCourier} />
            ) : null}

            {geocodedPoints.length === 0 ? (
              <div className={styles.mapEmptyState}>
                No geocoded delivery coordinates yet
              </div>
            ) : null}
          </div>
        </div>
      )}

      <LiveCourierRefreshControls
        autoRefreshEnabled={liveCourierAutoRefresh}
        refreshIntervalMs={liveCourierRefreshIntervalMs}
        lastRefreshedAt={liveCourierLastRefreshedAt}
        isDocumentVisible={isLiveCourierDocumentVisible}
        onAutoRefreshChange={setLiveCourierAutoRefresh}
        onRefreshIntervalChange={setLiveCourierRefreshIntervalMs}
        onRefreshNow={refreshLiveCouriersNow}
      />

      <LiveCourierMapSummary data={liveCourierMapData} />

      <LiveRouteMonitoringPanel data={liveRouteMonitoringData} />

      <SmartReroutePanel
        data={smartRerouteData}
        routeLines={routeLines}
        onAssistedRouteChange={() =>
          setAssistedRouteRevision((currentRevision) => currentRevision + 1)
        }
      />

      <div className={styles.needsGeocodingSection}>
        <h3 className={styles.needsGeocodingHeading}>Needs Geocoding</h3>
        {needsGeocodingPoints.length === 0 ? (
          <p className={styles.needsGeocodingEmpty}>
            All active delivery addresses are geocoded or awaiting lookup.
          </p>
        ) : (
          <ul className={styles.needsGeocodingList}>
            {needsGeocodingPoints.map((point) => (
              <NeedsGeocodingRow
                key={point.orderId}
                point={point}
                onOrderSelect={onOrderSelect}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
