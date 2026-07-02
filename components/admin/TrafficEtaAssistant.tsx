// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админ-панель
//
// Purpose (EN):
// Traffic-aware ETA assistant
//
// Назначение (RU):
// Ассистент ETA с учётом пробок
// ==================================================
"use client";

import styles from "@/components/admin/TrafficEtaAssistant.module.css";
import type { RouteDistancePlan } from "@/components/maps/distanceTypes";
import {
  buildCourierTrafficEtaViews,
  formatAverageSpeedKmh,
  formatRouteDistanceMeters,
  formatTrafficDelaySeconds,
  getTrafficDelayLevelLabel,
} from "@/components/maps/trafficEtaViews";
import type { CourierRouteLine } from "@/components/maps/routeLineTypes";
import { refreshTrafficForRouteLines } from "@/components/maps/yandexRouteTrafficActions";
import type { YandexCourierRoute } from "@/components/maps/yandexRoutingTypes";
import { useMemo, useState } from "react";

type TrafficEtaAssistantProps = {
  routeLines: CourierRouteLine[];
  realRouteLines: Record<string, YandexCourierRoute>;
  routeDistancePlan: RouteDistancePlan;
  onRealRouteLinesUpdate: (
    routes: Record<string, YandexCourierRoute>,
  ) => void;
};

function getDelayLevelClass(level: YandexCourierRoute["trafficDelayLevel"]) {
  switch (level) {
    case "high":
      return styles.delayLevelHigh;
    case "medium":
      return styles.delayLevelMedium;
    case "low":
      return styles.delayLevelLow;
    case "none":
    default:
      return styles.delayLevelNone;
  }
}

export function TrafficEtaAssistant({
  routeLines,
  realRouteLines,
  routeDistancePlan,
  onRealRouteLinesUpdate,
}: TrafficEtaAssistantProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState("");
  const [refreshWarning, setRefreshWarning] = useState("");

  const courierViews = useMemo(
    () =>
      buildCourierTrafficEtaViews(
        routeLines,
        realRouteLines,
        routeDistancePlan.courierPlans,
      ),
    [realRouteLines, routeDistancePlan.courierPlans, routeLines],
  );

  const handleRefreshTraffic = async () => {
    if (isRefreshing) {
      return;
    }

    const refreshTargets = routeLines.filter(
      (line) =>
        line.points.length >= 2 &&
        realRouteLines[line.courierId]?.status === "ready",
    );

    if (refreshTargets.length === 0) {
      setRefreshNotice("");
      setRefreshWarning(
        "Build road routes for visible couriers before refreshing traffic and ETA.",
      );
      return;
    }

    setIsRefreshing(true);
    setRefreshNotice("");
    setRefreshWarning("");

    try {
      const refreshedRoutes = await refreshTrafficForRouteLines(
        refreshTargets,
        realRouteLines,
      );
      onRealRouteLinesUpdate(refreshedRoutes);

      const refreshedList = Object.values(refreshedRoutes);
      const readyCount = refreshedList.filter(
        (route) => route.status === "ready",
      ).length;
      const fallbackCount = refreshedList.filter(
        (route) => route.status === "fallback",
      ).length;

      setRefreshNotice(
        readyCount > 0
          ? `Refreshed traffic and ETA for ${readyCount} visible courier route${readyCount === 1 ? "" : "s"}.`
          : "No provider traffic data was refreshed.",
      );

      if (fallbackCount > 0) {
        setRefreshWarning(
          `${fallbackCount} courier route${fallbackCount === 1 ? "" : "s"} kept existing road geometry with provider fallback ETA.`,
        );
      }
    } catch {
      setRefreshWarning(
        "Unable to refresh provider traffic and ETA right now.",
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <section
      className={styles.trafficEtaSection}
      aria-label="Traffic and provider ETA"
    >
      <div className={styles.trafficEtaHeader}>
        <h3 className={styles.trafficEtaHeading}>Traffic &amp; ETA</h3>
        <p className={styles.trafficEtaMeta}>
          Provider-based transport information for built road routes. Read-only
          insights only — no automatic routing or dispatch decisions.
        </p>
      </div>

      <div className={styles.trafficEtaActions}>
        <button
          type="button"
          className={styles.refreshTrafficButton}
          onClick={() => void handleRefreshTraffic()}
          disabled={isRefreshing || routeLines.length === 0}
        >
          {isRefreshing ? "Refreshing traffic & ETA…" : "Refresh traffic & ETA"}
        </button>
      </div>

      {refreshNotice ? (
        <p className={styles.trafficEtaNotice} role="status">
          {refreshNotice}
        </p>
      ) : null}

      {refreshWarning ? (
        <p className={styles.trafficEtaWarning} role="status">
          {refreshWarning}
        </p>
      ) : null}

      {courierViews.length === 0 ? (
        <p className={styles.trafficEtaEmpty}>
          No visible courier routes to show traffic and ETA for.
        </p>
      ) : (
        <ul className={styles.trafficEtaList}>
          {courierViews.map((view) => {
            const roadRoute = view.roadRoute;

            return (
              <li key={view.courierId} className={styles.trafficEtaItem}>
                <div className={styles.trafficEtaItemTop}>
                  <span
                    className={styles.legendSwatch}
                    style={{ backgroundColor: view.color }}
                  />
                  <strong>{view.courierName}</strong>
                  {roadRoute ? (
                    <span
                      className={`${styles.delayLevelBadge} ${getDelayLevelClass(roadRoute.trafficDelayLevel)}`}
                    >
                      Delay: {getTrafficDelayLevelLabel(roadRoute.trafficDelayLevel)}
                    </span>
                  ) : null}
                  {roadRoute?.fromCache ? (
                    <span className={styles.cacheBadge}>Cached route</span>
                  ) : null}
                </div>

                <div className={styles.trafficEtaMetrics}>
                  <div>
                    <span>Road distance</span>
                    <strong>
                      {formatRouteDistanceMeters(
                        roadRoute?.providerDistanceMeters ??
                          roadRoute?.distanceMeters ??
                          null,
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>ETA without traffic</span>
                    <strong>{view.etaWithoutTrafficLabel}</strong>
                  </div>
                  <div>
                    <span>ETA with traffic</span>
                    <strong>{view.etaWithTrafficLabel}</strong>
                  </div>
                  <div>
                    <span>Traffic delay</span>
                    <strong>
                      {formatTrafficDelaySeconds(roadRoute?.trafficDelaySeconds)}
                    </strong>
                  </div>
                  <div>
                    <span>Average speed</span>
                    <strong>
                      {formatAverageSpeedKmh(roadRoute?.averageSpeedKmh)}
                    </strong>
                  </div>
                </div>

                {view.usesLocalFallback ? (
                  <p className={styles.localFallbackNote}>
                    Showing local straight-line ETA fallback because provider
                    traffic data is unavailable.
                  </p>
                ) : null}

                {view.warnings.length > 0 ? (
                  <ul className={styles.warningList}>
                    {view.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
