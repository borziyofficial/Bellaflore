// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админ-панель
//
// Purpose (EN):
// Distance and ETA calculation assistant
//
// Назначение (RU):
// Ассистент расчёта расстояния и ETA
// ==================================================
"use client";

import styles from "@/components/admin/DistanceEtaAssistant.module.css";
import type { AdminOrderRecord } from "@/components/admin/adminOrderList";
import type { CourierRouteDistancePlan, DistanceLeg } from "@/components/maps/distanceTypes";
import { formatEstimatedMinutes } from "@/components/maps/etaCalculator";
import type { GeocodingOverrides } from "@/components/maps/orderMapData";
import {
  buildRouteDistancePlan,
  formatDistanceKm,
  getDistanceLegStatusLabel,
} from "@/components/maps/routeDistancePlanner";
import { useMemo } from "react";

type DistanceEtaAssistantProps = {
  orders: AdminOrderRecord[];
  geocodingOverrides: GeocodingOverrides;
  onOrderSelect: (orderId: string) => void;
};

function DistanceLegItem({
  leg,
  legIndex,
  onOrderSelect,
}: {
  leg: DistanceLeg;
  legIndex: number;
  onOrderSelect: (orderId: string) => void;
}) {
  const isMissingCoordinates = leg.status === "missing_coordinates";

  return (
    <li className={styles.legItem}>
      <div className={styles.legHeader}>
        <strong>
          Leg {legIndex + 1}: {leg.fromOrderId} → {leg.toOrderId}
        </strong>
        <span
          className={`${styles.legStatusBadge} ${
            isMissingCoordinates ? styles.legStatusWarning : styles.legStatusOk
          }`}
        >
          {getDistanceLegStatusLabel(leg.status)}
        </span>
      </div>

      <div className={styles.legMetrics}>
        <div>
          <span>Distance</span>
          <strong>{formatDistanceKm(leg.distanceKm)}</strong>
        </div>
        <div>
          <span>ETA</span>
          <strong>{formatEstimatedMinutes(leg.estimatedMinutes)}</strong>
        </div>
        <div>
          <span>Method</span>
          <strong>Straight line</strong>
        </div>
      </div>

      {isMissingCoordinates ? (
        <p className={styles.legWarning} role="status">
          One or both delivery points are missing geocoded coordinates.
        </p>
      ) : null}

      <div className={styles.legOrderLinks}>
        <button type="button" onClick={() => onOrderSelect(leg.fromOrderId)}>
          Open {leg.fromOrderId}
        </button>
        <button type="button" onClick={() => onOrderSelect(leg.toOrderId)}>
          Open {leg.toOrderId}
        </button>
      </div>
    </li>
  );
}

function CourierDistancePlanCard({
  plan,
  onOrderSelect,
}: {
  plan: CourierRouteDistancePlan;
  onOrderSelect: (orderId: string) => void;
}) {
  return (
    <article className={styles.courierCard}>
      <div className={styles.courierCardHeader}>
        <h4 className={styles.courierName}>{plan.courierName}</h4>
        <div className={styles.courierTotals}>
          <span>{formatDistanceKm(plan.totalDistanceKm)} total</span>
          <span>
            {formatEstimatedMinutes(plan.totalEstimatedMinutes)} travel
          </span>
        </div>
      </div>

      {plan.missingCoordinateCount > 0 ? (
        <p className={styles.courierWarning} role="status">
          {plan.missingCoordinateCount} route leg
          {plan.missingCoordinateCount === 1 ? "" : "s"} missing coordinates.
        </p>
      ) : null}

      {plan.legs.length === 0 ? (
        <p className={styles.emptyLegs}>
          Not enough active stops to calculate route distance.
        </p>
      ) : (
        <ul className={styles.legList}>
          {plan.legs.map((leg, index) => (
            <DistanceLegItem
              key={`${leg.fromOrderId}-${leg.toOrderId}`}
              leg={leg}
              legIndex={index}
              onOrderSelect={onOrderSelect}
            />
          ))}
        </ul>
      )}
    </article>
  );
}

export function DistanceEtaAssistant({
  orders,
  geocodingOverrides,
  onOrderSelect,
}: DistanceEtaAssistantProps) {
  const distancePlan = useMemo(
    () => buildRouteDistancePlan(orders, geocodingOverrides),
    [geocodingOverrides, orders],
  );

  return (
    <section
      className={styles.distanceEtaSection}
      aria-label="Distance and ETA foundation"
    >
      <h3 className={styles.distanceEtaHeading}>Distance &amp; ETA</h3>
      <p className={styles.distanceEtaMeta}>
        Straight-line distance and estimated travel time between consecutive
        active deliveries. Uses existing geocoded coordinates only — no routing
        API, traffic, or GPS.
      </p>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span>Couriers</span>
          <strong>{distancePlan.summary.courierCount}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Route legs</span>
          <strong>{distancePlan.summary.totalActiveLegs}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Total distance</span>
          <strong>{formatDistanceKm(distancePlan.summary.totalDistanceKm)}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Total ETA</span>
          <strong>
            {formatEstimatedMinutes(distancePlan.summary.totalEstimatedMinutes)}
          </strong>
        </div>
      </div>

      {distancePlan.summary.missingCoordinateLegs > 0 ? (
        <p className={styles.globalWarning} role="status">
          {distancePlan.summary.missingCoordinateLegs} leg
          {distancePlan.summary.missingCoordinateLegs === 1 ? "" : "s"} cannot
          be calculated because coordinates are missing. Geocode addresses in
          Maps Foundation first.
        </p>
      ) : null}

      {distancePlan.courierPlans.length === 0 ? (
        <p className={styles.emptyState}>
          No assigned courier routes with active deliveries yet.
        </p>
      ) : (
        <div className={styles.courierPlanList}>
          {distancePlan.courierPlans.map((plan) => (
            <CourierDistancePlanCard
              key={plan.courierId}
              plan={plan}
              onOrderSelect={onOrderSelect}
            />
          ))}
        </div>
      )}
    </section>
  );
}
