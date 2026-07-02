// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админ-панель
//
// Purpose (EN):
// Delivery planner with routes and dispatch
//
// Назначение (RU):
// Планировщик доставки с маршрутами
// ==================================================
"use client";

import { AdminOrderDetailsPanel } from "@/components/admin/AdminOrderDetailsPanel";
import { assignOrderCourier } from "@/components/admin/assignOrderCourier";
import styles from "@/components/admin/AdminDeliveryPlannerContent.module.css";
import panelStyles from "@/components/admin/AdminPanel.module.css";
import {
  buildDeliveryPlannerPlan,
  getDeliveryPlannerConflictLabel,
  getDeliveryPlannerWorkloadLabel,
  type DeliveryPlannerDaySection,
  type DeliveryPlannerOrderEntry,
  type DeliveryPlannerWorkloadLevel,
} from "@/components/admin/adminDeliveryPlanner";
import {
  getAllOrders,
  patchStoredAdminOrder,
  type AdminOrderRecord,
} from "@/components/admin/adminOrderList";
import { SmartDispatchRecommendation } from "@/components/admin/SmartDispatchRecommendation";
import { RoutePlanningAssistant } from "@/components/admin/RoutePlanningAssistant";
import { RouteOptimizationAssistant } from "@/components/admin/RouteOptimizationAssistant";
import { DistanceEtaAssistant } from "@/components/admin/DistanceEtaAssistant";
import { MapsFoundationAssistant } from "@/components/admin/MapsFoundationAssistant";
import { MapProviderStatus } from "@/components/admin/MapProviderStatus";
import { GeographicMapPreview } from "@/components/admin/GeographicMapPreview";
import {
  DeliveryMapVisibilityToggle,
  DeliveryZoneMap,
} from "@/components/deliveryZones/DeliveryZoneMap";
import { formatDeliveryZonePriceRub } from "@/components/deliveryZones/deliveryZoneDisplayFormat";
import { readAllGeocodingCacheEntries } from "@/components/maps/geocodingCache";
import { isYandexGeocodingEnabled } from "@/components/maps/mapProviderRegistry";
import type { GeocodingOverrides } from "@/components/maps/orderMapData";
import { getOrderStatusLabel } from "@/components/orders/orderStatus";
import { submitTelegramCourierAssigned } from "@/components/telegram/submitTelegramCourierAssigned";
import { useState, useSyncExternalStore, type ComponentProps } from "react";

type GeographicMapPreviewProps = ComponentProps<typeof GeographicMapPreview>;

function LazyGeographicMapPreview(props: GeographicMapPreviewProps) {
  const [isMapVisible, setIsMapVisible] = useState(false);

  return (
    <section className={styles.lazyMapSection}>
      <div className={styles.lazyMapHeader}>
        <h2 className={styles.plannerSummaryHeading}>
          Orders &amp; couriers map (mock)
        </h2>
        <p className={styles.lazyMapLead}>
          Foundation preview with mock order markers and route lines. Yandex SDK
          loads only after opening the map — no live courier engines connected.
        </p>
      </div>
      <DeliveryMapVisibilityToggle
        isVisible={isMapVisible}
        onHide={() => setIsMapVisible(false)}
        onShow={() => setIsMapVisible(true)}
      />
      {isMapVisible ? (
        <GeographicMapPreview {...props} />
      ) : (
        <p className={styles.lazyMapStub} role="status">
          Карта заказов и курьеров скрыта. Нажмите «Показать карту» для mock preview.
        </p>
      )}
    </section>
  );
}

function getWorkloadLevelClass(level: DeliveryPlannerWorkloadLevel): string {
  switch (level) {
    case "medium":
      return styles.workloadLevelMedium;
    case "high":
      return styles.workloadLevelHigh;
    case "low":
    default:
      return styles.workloadLevelLow;
  }
}

type DeliveryPlannerCardProps = {
  entry: DeliveryPlannerOrderEntry;
  allOrders: AdminOrderRecord[];
  onOrderSelect: (orderId: string) => void;
  onAssignRecommended: (orderId: string, courierId: string) => Promise<void>;
  assigningOrderId: string | null;
  assignError: string;
  assignNotice: string;
};

function DeliveryPlannerCard({
  entry,
  allOrders,
  onOrderSelect,
  onAssignRecommended,
  assigningOrderId,
  assignError,
  assignNotice,
}: DeliveryPlannerCardProps) {
  const { order, conflicts } = entry;
  const hasConflict = conflicts.length > 0;
  const isUnassigned = !order.assignedCourierId?.trim();
  const isAssigning = assigningOrderId === order.orderId;

  return (
    <li className={styles.deliveryCardItem}>
      <button
        type="button"
        className={`${styles.deliveryCardButton} ${
          hasConflict ? styles.deliveryCardConflict : ""
        }`}
        onClick={() => onOrderSelect(order.orderId)}
      >
        <div className={styles.deliveryCardTop}>
          <strong>{order.orderId}</strong>
          <span className={styles.statusBadge}>
            {getOrderStatusLabel(order.status)}
          </span>
        </div>

        <div className={styles.deliveryMeta}>
          <div>
            <span>Customer</span>
            <strong>{order.customerName}</strong>
          </div>
          <div>
            <span>Address</span>
            <strong>{order.deliveryAddress || "—"}</strong>
          </div>
          <div>
            <span>Courier</span>
            <strong>{order.assignedCourierName ?? "Not assigned"}</strong>
          </div>
          <div>
            <span>Delivery date</span>
            <strong>{order.deliveryDate || "—"}</strong>
          </div>
          <div>
            <span>Interval</span>
            <strong>{order.deliveryTime || "—"}</strong>
          </div>
        </div>

        {hasConflict ? (
          <ul className={styles.conflictList}>
            {conflicts.map((conflict) => (
              <li key={conflict} className={styles.conflictBadge}>
                {getDeliveryPlannerConflictLabel(conflict)}
              </li>
            ))}
          </ul>
        ) : null}
      </button>

      {isUnassigned ? (
        <SmartDispatchRecommendation
          order={order}
          allOrders={allOrders}
          onAssignRecommended={(courierId) =>
            onAssignRecommended(order.orderId, courierId)
          }
          assigning={isAssigning}
          assignError={isAssigning ? assignError : ""}
          assignNotice={isAssigning ? assignNotice : ""}
        />
      ) : null}
    </li>
  );
}

function DeliveryPlannerDayBlock({
  section,
  allOrders,
  onOrderSelect,
  onAssignRecommended,
  assigningOrderId,
  assignError,
  assignNotice,
}: {
  section: DeliveryPlannerDaySection;
  allOrders: AdminOrderRecord[];
  onOrderSelect: (orderId: string) => void;
  onAssignRecommended: (orderId: string, courierId: string) => Promise<void>;
  assigningOrderId: string | null;
  assignError: string;
  assignNotice: string;
}) {
  const totalOrders =
    section.intervals.reduce(
      (count, interval) => count + interval.orders.length,
      0,
    ) + section.unscheduledOrders.length;

  return (
    <section className={styles.daySection} aria-label={section.title}>
      <h3 className={styles.daySectionTitle}>
        {section.title} · {totalOrders}
      </h3>

      {totalOrders === 0 ? (
        <p className={styles.emptyState}>Нет доставок</p>
      ) : (
        <>
          {section.intervals.map((interval) => (
            <div key={interval.label} className={styles.intervalSection}>
              <h4 className={styles.intervalHeading}>
                {interval.label} · {interval.orders.length}
              </h4>
              {interval.orders.length === 0 ? (
                <p className={styles.emptyInterval}>Нет заказов</p>
              ) : (
                <ul className={styles.deliveryList}>
                  {interval.orders.map((entry) => (
                    <DeliveryPlannerCard
                      key={entry.order.orderId}
                      entry={entry}
                      allOrders={allOrders}
                      onOrderSelect={onOrderSelect}
                      onAssignRecommended={onAssignRecommended}
                      assigningOrderId={assigningOrderId}
                      assignError={assignError}
                      assignNotice={assignNotice}
                    />
                  ))}
                </ul>
              )}
            </div>
          ))}

          {section.unscheduledOrders.length > 0 ? (
            <div className={styles.intervalSection}>
              <h4 className={styles.intervalHeading}>
                Без интервала · {section.unscheduledOrders.length}
              </h4>
              <ul className={styles.deliveryList}>
                {section.unscheduledOrders.map((entry) => (
                  <DeliveryPlannerCard
                    key={entry.order.orderId}
                    entry={entry}
                    allOrders={allOrders}
                    onOrderSelect={onOrderSelect}
                    onAssignRecommended={onAssignRecommended}
                    assigningOrderId={assigningOrderId}
                    assignError={assignError}
                    assignNotice={assignNotice}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

export function AdminDeliveryPlannerContent() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [ordersRevision, setOrdersRevision] = useState(0);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [assignError, setAssignError] = useState("");
  const [assignNotice, setAssignNotice] = useState("");
  const [geocodingOverrides, setGeocodingOverrides] = useState<GeocodingOverrides>(
    () => {
      if (typeof window === "undefined" || !isYandexGeocodingEnabled()) {
        return {};
      }

      const cachedEntries = readAllGeocodingCacheEntries();

      return Object.fromEntries(
        Object.entries(cachedEntries).map(([addressKey, result]) => [
          addressKey,
          {
            ...result,
            fromCache: true,
          },
        ]),
      );
    },
  );
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  void ordersRevision;

  const allOrders = isClient ? getAllOrders() : [];
  const plannerPlan = isClient
    ? buildDeliveryPlannerPlan(allOrders)
    : {
        daySections: [],
        courierWorkloads: [],
        totalDeliveries: 0,
      };

  const handleAssignRecommended = async (orderId: string, courierId: string) => {
    const order = allOrders.find((entry) => entry.orderId === orderId);

    if (!order || assigningOrderId) {
      return;
    }

    const previousCourierId = order.assignedCourierId ?? "";

    setAssignError("");
    setAssignNotice("");
    setAssigningOrderId(orderId);

    const result = assignOrderCourier(order, courierId);

    if (!result.ok) {
      setAssignError(result.error);
      setAssigningOrderId(null);
      return;
    }

    const saved = patchStoredAdminOrder(orderId, {
      timeline: result.order.timeline,
      updatedAt: result.order.updatedAt,
      assignedCourierId: result.order.assignedCourierId,
      assignedCourierName: result.order.assignedCourierName,
      assignedCourierPhone: result.order.assignedCourierPhone,
    });

    if (!saved) {
      setAssignError("Unable to save courier assignment locally.");
      setAssigningOrderId(null);
      return;
    }

    setOrdersRevision((current) => current + 1);

    if (previousCourierId !== courierId) {
      const primaryItem = order.items[0];
      const telegramResult = await submitTelegramCourierAssigned({
        orderId: order.orderId,
        bouquetTitle: primaryItem?.bouquetName ?? "",
        priceRub: primaryItem?.priceRub ?? order.totalPriceRub,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        courierName: result.order.assignedCourierName ?? "",
        courierPhone: result.order.assignedCourierPhone ?? "",
        deliveryAddress: order.deliveryAddress,
        deliveryDate: order.deliveryDate,
        deliveryInterval: order.deliveryTime,
      });

      if (!telegramResult.ok) {
        setAssignNotice(
          `Courier saved locally. Telegram notification failed: ${telegramResult.message}`,
        );
      }
    }

    setAssigningOrderId(null);
  };

  if (selectedOrderId) {
    return (
      <AdminOrderDetailsPanel
        orderId={selectedOrderId}
        orders={allOrders}
        onBack={() => setSelectedOrderId(null)}
        onOrderUpdated={() => setOrdersRevision((current) => current + 1)}
      />
    );
  }

  return (
    <section
      className={styles.plannerSection}
      aria-labelledby="delivery-planner-title"
    >
      <div className={panelStyles.adminOrdersHeader}>
        <div>
          <p className={panelStyles.adminPlaceholderEyebrow}>Logistics</p>
          <h2
            id="delivery-planner-title"
            className={panelStyles.adminPlaceholderTitle}
          >
            Delivery Planner
          </h2>
        </div>
        <p className={panelStyles.adminOrdersCount}>
          {plannerPlan.totalDeliveries} planned deliveries
        </p>
      </div>

      <section className={styles.plannerSummary} aria-label="Courier workload">
        <h3 className={styles.plannerSummaryHeading}>Courier workload</h3>
        <p className={styles.plannerSummaryMeta}>
          Assigned deliveries across today, tomorrow, and future dates.
        </p>
        {plannerPlan.courierWorkloads.length === 0 ? (
          <p className={styles.emptyInterval}>No assigned courier deliveries.</p>
        ) : (
          <ul className={styles.workloadList}>
            {plannerPlan.courierWorkloads.map((workload) => (
              <li key={workload.courierId} className={styles.workloadBadge}>
                <span>
                  {workload.courierName} · {workload.deliveryCount}
                </span>
                <span
                  className={`${styles.workloadLevel} ${getWorkloadLevelClass(
                    workload.workloadLevel,
                  )}`}
                >
                  {getDeliveryPlannerWorkloadLabel(workload.workloadLevel)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <RoutePlanningAssistant
        orders={allOrders}
        onOrderSelect={setSelectedOrderId}
      />

      <RouteOptimizationAssistant
        orders={allOrders}
        onOrderSelect={setSelectedOrderId}
      />

      <DistanceEtaAssistant
        orders={allOrders}
        geocodingOverrides={geocodingOverrides}
        onOrderSelect={setSelectedOrderId}
      />

      <MapProviderStatus />

      <section className={styles.deliveryZoneMapSection}>
        <h2 className={styles.plannerSummaryHeading}>Delivery zone map</h2>
        <p className={styles.lazyMapLead}>
          Colored MKAD zones with legend. Lazy Yandex SDK — same gate as checkout
          and home delivery section.
        </p>
        <DeliveryZoneMap
          variant="admin"
          selectedZoneId={null}
          zoneStatus="available"
          formatPrice={formatDeliveryZonePriceRub}
        />
      </section>

      <MapsFoundationAssistant
        orders={allOrders}
        geocodingOverrides={geocodingOverrides}
        onGeocodingOverridesChange={(nextOverrides) => {
          setGeocodingOverrides((currentOverrides) => ({
            ...currentOverrides,
            ...nextOverrides,
          }));
        }}
        onOrderSelect={setSelectedOrderId}
      />

      <LazyGeographicMapPreview
        orders={allOrders}
        geocodingOverrides={geocodingOverrides}
        onOrderSelect={setSelectedOrderId}
      />

      {plannerPlan.daySections.map((section) => (
        <DeliveryPlannerDayBlock
          key={section.group}
          section={section}
          allOrders={allOrders}
          onOrderSelect={setSelectedOrderId}
          onAssignRecommended={handleAssignRecommended}
          assigningOrderId={assigningOrderId}
          assignError={assignError}
          assignNotice={assignNotice}
        />
      ))}
    </section>
  );
}
