// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админ-панель
//
// Purpose (EN):
// Route planning assistant for dispatch
//
// Назначение (RU):
// Ассистент планирования маршрутов для диспетчеризации
// ==================================================
"use client";

import styles from "@/components/admin/RoutePlanningAssistant.module.css";
import {
  buildRoutePlanningPlan,
  getRoutePlanningWarningLabel,
  type RoutePlanningCourierRoute,
  type RoutePlanningStop,
} from "@/components/admin/adminRoutePlanning";
import type { AdminOrderRecord } from "@/components/admin/adminOrderList";
import { getOrderStatusLabel } from "@/components/orders/orderStatus";
import { useMemo } from "react";

type RoutePlanningAssistantProps = {
  orders: AdminOrderRecord[];
  onOrderSelect: (orderId: string) => void;
};

type RouteStopListProps = {
  stops: RoutePlanningStop[];
  completed?: boolean;
  onOrderSelect: (orderId: string) => void;
};

function RouteStopList({
  stops,
  completed = false,
  onOrderSelect,
}: RouteStopListProps) {
  if (stops.length === 0) {
    return <p className={styles.emptyRoute}>No stops</p>;
  }

  return (
    <ul className={styles.routeStopList}>
      {stops.map((stop) => {
        const hasWarning = stop.warnings.length > 0;

        return (
          <li key={stop.order.orderId}>
            <button
              type="button"
              className={`${styles.routeStopButton} ${
                completed ? styles.completedStop : ""
              } ${hasWarning ? styles.routeStopButtonWarning : ""}`}
              onClick={() => onOrderSelect(stop.order.orderId)}
            >
              <div className={styles.routeStopTop}>
                <div className={styles.routeStopIdentity}>
                  <span className={styles.routePosition}>{stop.position}</span>
                  <strong>{stop.order.orderId}</strong>
                </div>
                <span className={styles.statusBadge}>
                  {getOrderStatusLabel(stop.order.status)}
                </span>
              </div>

              <div className={styles.routeStopMeta}>
                <div>
                  <span>Customer</span>
                  <strong>{stop.order.customerName}</strong>
                </div>
                <div>
                  <span>Address</span>
                  <strong>{stop.order.deliveryAddress || "—"}</strong>
                </div>
                <div>
                  <span>Interval</span>
                  <strong>{stop.order.deliveryTime || "—"}</strong>
                </div>
                <div>
                  <span>Delivery date</span>
                  <strong>{stop.order.deliveryDate || "—"}</strong>
                </div>
              </div>

              {hasWarning ? (
                <ul className={styles.warningList}>
                  {stop.warnings.map((warning) => (
                    <li key={warning} className={styles.warningBadge}>
                      {getRoutePlanningWarningLabel(warning)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function CourierRouteBlock({
  route,
  onOrderSelect,
}: {
  route: RoutePlanningCourierRoute;
  onOrderSelect: (orderId: string) => void;
}) {
  return (
    <section
      className={styles.courierRouteBlock}
      aria-label={`${route.courierName} route`}
    >
      <h4 className={styles.courierRouteTitle}>{route.courierName}</h4>

      <div>
        <p className={styles.routeGroupTitle}>
          Active route · {route.activeStops.length}
        </p>
        <RouteStopList stops={route.activeStops} onOrderSelect={onOrderSelect} />
      </div>

      <div>
        <p className={styles.routeGroupTitle}>
          Completed · {route.completedStops.length}
        </p>
        <RouteStopList
          stops={route.completedStops}
          completed
          onOrderSelect={onOrderSelect}
        />
      </div>
    </section>
  );
}

export function RoutePlanningAssistant({
  orders,
  onOrderSelect,
}: RoutePlanningAssistantProps) {
  const routePlan = useMemo(
    () => buildRoutePlanningPlan(orders),
    [orders],
  );

  return (
    <section
      className={styles.routePlanningSection}
      aria-label="Route planning assistant"
    >
      <h3 className={styles.routePlanningHeading}>Route Planning</h3>
      <p className={styles.routePlanningMeta}>
        Suggested delivery sequence by date and interval. Read-only assistant.
      </p>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span>Active deliveries</span>
          <strong>{routePlan.summary.totalActiveDeliveries}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Completed</span>
          <strong>{routePlan.summary.completedDeliveries}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Warnings</span>
          <strong>{routePlan.summary.warningCount}</strong>
        </div>
      </div>

      {routePlan.courierRoutes.length === 0 ? (
        <p className={styles.emptyRoute}>No assigned courier routes yet.</p>
      ) : (
        routePlan.courierRoutes.map((route) => (
          <CourierRouteBlock
            key={route.courierId}
            route={route}
            onOrderSelect={onOrderSelect}
          />
        ))
      )}
    </section>
  );
}
