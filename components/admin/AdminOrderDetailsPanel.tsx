// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админ-панель
//
// Purpose (EN):
// Side panel with full order details
//
// Назначение (RU):
// Боковая панель деталей заказа
// ==================================================
"use client";

import { assignOrderCourier } from "@/components/admin/assignOrderCourier";
import styles from "@/components/admin/AdminPanel.module.css";
import { getOrderDetails } from "@/components/admin/adminOrderDetails";
import {
  ADMIN_ORDER_STATUS_FILTERS,
  findOrderById,
  patchStoredAdminOrder,
  type AdminOrderRecord,
} from "@/components/admin/adminOrderList";
import {
  getOrderStatusLabel,
  type OrderStatusId,
} from "@/components/orders/orderStatus";
import { updateOrderStatus } from "@/components/orders/updateOrderStatus";
import { submitTelegramStatusUpdate } from "@/components/telegram/submitTelegramStatusUpdate";
import { submitTelegramCourierAssigned } from "@/components/telegram/submitTelegramCourierAssigned";
import { SmartDispatchRecommendation } from "@/components/admin/SmartDispatchRecommendation";
import { DeliveryZoneMap } from "@/components/deliveryZones/DeliveryZoneMap";
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";
import { getDeliveryValidationStatusLabel } from "@/components/deliveryValidation/deliveryValidationMessages";
import type { DeliveryValidationStatus } from "@/components/deliveryValidation/deliveryValidationTypes";
import { getDemoCouriers } from "@/components/couriers/courierModel";
import { useState } from "react";

type AdminOrderDetailsPanelProps = {
  orderId: string;
  orders: AdminOrderRecord[];
  onBack: () => void;
  onOrderUpdated: () => void;
};

function formatAdminPrice(priceRub: number): string {
  return `${priceRub.toLocaleString("ru-RU")} ₽`;
}

function formatTimelineDate(createdAt: string): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminOrderDetailsPanel({
  orderId,
  orders,
  onBack,
  onOrderUpdated,
}: AdminOrderDetailsPanelProps) {
  const [statusError, setStatusError] = useState("");
  const [telegramNotice, setTelegramNotice] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<OrderStatusId | null>(
    null,
  );
  const [assigningCourierId, setAssigningCourierId] = useState<string | null>(
    null,
  );
  const [courierError, setCourierError] = useState("");
  const [courierNotice, setCourierNotice] = useState("");
  const demoCouriers = getDemoCouriers();
  const details = getOrderDetails(orderId, orders);
  const order = findOrderById(orderId, orders);

  const handleStatusChange = async (nextStatus: OrderStatusId) => {
    if (!order || updatingStatus) {
      return;
    }

    setStatusError("");
    setTelegramNotice("");
    setUpdatingStatus(nextStatus);

    const result = updateOrderStatus(order, nextStatus, {
      updatedBy: "Admin",
      source: "admin",
      visibleToCustomer: true,
    });

    if (!result.ok) {
      setStatusError(result.error);
      setUpdatingStatus(null);
      return;
    }

    const saved = patchStoredAdminOrder(orderId, {
      status: result.order.status,
      timeline: result.order.timeline,
      updatedAt: result.order.updatedAt,
    });

    if (!saved) {
      setStatusError("Unable to save the updated order locally.");
      setUpdatingStatus(null);
      return;
    }

    onOrderUpdated();

    const primaryItem = order.items[0];
    const telegramResult = await submitTelegramStatusUpdate({
      orderId: order.orderId,
      bouquet: primaryItem?.bouquetName ?? "",
      status: nextStatus,
      updatedAt: result.order.updatedAt ?? new Date().toISOString(),
      customer: order.customerName,
      phone: order.customerPhone,
    });

    if (!telegramResult.ok) {
      setTelegramNotice(
        `Status saved locally. Telegram notification failed: ${telegramResult.message}`,
      );
    }

    setUpdatingStatus(null);
  };

  const handleCourierAssign = async (courierId: string) => {
    if (!order || assigningCourierId || updatingStatus) {
      return;
    }

    const previousCourierId = order.assignedCourierId ?? "";

    setCourierError("");
    setCourierNotice("");
    setAssigningCourierId(courierId);

    const result = assignOrderCourier(order, courierId);

    if (!result.ok) {
      setCourierError(result.error);
      setAssigningCourierId(null);
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
      setCourierError("Unable to save courier assignment locally.");
      setAssigningCourierId(null);
      return;
    }

    onOrderUpdated();

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
        setCourierNotice(
          `Courier saved locally. Telegram notification failed: ${telegramResult.message}`,
        );
      }
    }

    setAssigningCourierId(null);
  };

  const currentCourierLabel =
    order?.assignedCourierName?.trim() || details?.assignedCourierName || null;

  if (!details || !order) {
    return (
      <section className={styles.adminOrderDetailsSection}>
        <button
          type="button"
          className={styles.adminOrderDetailsBack}
          onClick={onBack}
        >
          ← Back to orders
        </button>
        <div className={styles.adminOrdersEmpty}>
          <p>Order not found.</p>
          <span>The selected order is no longer available.</span>
        </div>
      </section>
    );
  }

  return (
    <section
      className={styles.adminOrderDetailsSection}
      aria-labelledby="admin-order-details-title"
    >
      <button
        type="button"
        className={styles.adminOrderDetailsBack}
        onClick={onBack}
      >
        ← Back to orders
      </button>

      <div className={styles.adminOrderDetailsHeader}>
        <div>
          <p className={styles.adminPlaceholderEyebrow}>Order details</p>
          <h2
            id="admin-order-details-title"
            className={styles.adminPlaceholderTitle}
          >
            {details.orderId}
          </h2>
        </div>
        <span className={styles.adminOrdersStatusBadge}>
          {details.currentStatusLabel}
        </span>
      </div>

      <div className={styles.adminOrderDetailsCard}>
        <h3 className={styles.adminOrderDetailsSubheading}>Status</h3>
        <p className={styles.adminOrderDetailsMuted}>
          Current status:{" "}
          <strong className={styles.adminOrderDetailsCurrentStatus}>
            {details.currentStatusLabel}
          </strong>
        </p>
        <div
          className={styles.adminStatusActions}
          role="group"
          aria-label="Update order status"
        >
          {ADMIN_ORDER_STATUS_FILTERS.map((statusId) => {
            const isCurrentStatus = details.currentStatus === statusId;
            const isUpdating = updatingStatus === statusId;

            return (
              <button
                key={statusId}
                type="button"
                className={`${styles.adminStatusActionButton} ${
                  isCurrentStatus ? styles.adminStatusActionButtonActive : ""
                }`}
                disabled={Boolean(updatingStatus) || isCurrentStatus}
                onClick={() => handleStatusChange(statusId)}
              >
                {isUpdating ? "Updating..." : getOrderStatusLabel(statusId)}
              </button>
            );
          })}
        </div>
        {statusError ? (
          <p className={styles.adminOrderDetailsError} role="alert">
            {statusError}
          </p>
        ) : null}
        {telegramNotice ? (
          <p className={styles.adminOrderDetailsNotice} role="status">
            {telegramNotice}
          </p>
        ) : null}
      </div>

      <div className={styles.adminOrderDetailsCard}>
        <h3 className={styles.adminOrderDetailsSubheading}>Courier</h3>
        <p className={styles.adminOrderDetailsMuted}>
          Current courier:{" "}
          <strong className={styles.adminOrderDetailsCurrentStatus}>
            {currentCourierLabel ?? "Not assigned"}
          </strong>
        </p>
        {currentCourierLabel && details?.assignedCourierPhone ? (
          <p className={styles.adminOrderDetailsMuted}>
            Phone:{" "}
            <strong className={styles.adminOrderDetailsCurrentStatus}>
              {details.assignedCourierPhone}
            </strong>
          </p>
        ) : null}
        {!currentCourierLabel ? (
          <SmartDispatchRecommendation
            order={order}
            allOrders={orders}
            onAssignRecommended={handleCourierAssign}
            assigning={Boolean(assigningCourierId)}
            assignError={courierError}
            assignNotice={courierNotice}
          />
        ) : null}
        <p className={styles.adminCourierAssignLabel}>Assign Courier</p>
        <div
          className={styles.adminStatusActions}
          role="group"
          aria-label="Assign courier"
        >
          {demoCouriers.map((courier) => {
            const isAssigned = order?.assignedCourierId === courier.id;
            const isAssigning = assigningCourierId === courier.id;

            return (
              <button
                key={courier.id}
                type="button"
                className={`${styles.adminStatusActionButton} ${
                  isAssigned ? styles.adminStatusActionButtonActive : ""
                }`}
                disabled={
                  Boolean(updatingStatus) ||
                  Boolean(assigningCourierId) ||
                  !courier.isAvailable
                }
                onClick={() => handleCourierAssign(courier.id)}
              >
                {isAssigning ? "Assigning..." : courier.fullName}
              </button>
            );
          })}
        </div>
        {courierError ? (
          <p className={styles.adminOrderDetailsError} role="alert">
            {courierError}
          </p>
        ) : null}
        {courierNotice ? (
          <p className={styles.adminOrderDetailsNotice} role="status">
            {courierNotice}
          </p>
        ) : null}
      </div>

      <div className={styles.adminOrderDetailsCard}>
        <div className={styles.adminOrdersMetaGrid}>
          <div>
            <span>Order ID</span>
            <strong>{details.orderId}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{details.currentStatusLabel}</strong>
          </div>
          <div>
            <span>Bouquet</span>
            <strong>
              {details.bouquet || "—"}
              {details.quantity > 1 ? ` × ${details.quantity}` : ""}
            </strong>
          </div>
          <div>
            <span>Price</span>
            <strong>{formatAdminPrice(details.priceRub)}</strong>
          </div>
          <div>
            <span>Bouquets total</span>
            <strong>{formatAdminPrice(details.bouquetsTotalRub)}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>{formatAdminPrice(details.totalPriceRub)}</strong>
          </div>
          <div>
            <span>Customer</span>
            <strong>{details.customer}</strong>
          </div>
          <div>
            <span>Phone</span>
            <strong>{details.phone}</strong>
          </div>
          <div>
            <span>Delivery address</span>
            <strong>{details.deliveryAddress || "—"}</strong>
          </div>
          <div>
            <span>Delivery date</span>
            <strong>{details.deliveryDate || "—"}</strong>
          </div>
          <div>
            <span>Delivery interval</span>
            <strong>{details.deliveryInterval || "—"}</strong>
          </div>
          {details.validationStatus ? (
            <>
              <div>
                <span>Validation status</span>
                <strong>
                  {getDeliveryValidationStatusLabel(
                    details.validationStatus as DeliveryValidationStatus,
                  )}
                </strong>
              </div>
              <div>
                <span>Validation warnings</span>
                <strong>
                  {details.validationWarnings.length > 0
                    ? details.validationWarnings.join("; ")
                    : "—"}
                </strong>
              </div>
              <div>
                <span>Validation timestamp</span>
                <strong>
                  {details.validatedAt
                    ? new Date(details.validatedAt).toLocaleString("ru-RU")
                    : "—"}
                </strong>
              </div>
              <div>
                <span>Detection mode</span>
                <strong>{details.deliveryZoneDetectionMode || "—"}</strong>
              </div>
            </>
          ) : null}
          {details.deliveryZoneId ? (
            <>
              <div>
                <span>Delivery zone</span>
                <strong>{details.deliveryZoneLabel || details.deliveryZoneId}</strong>
              </div>
              <div>
                <span>Zone delivery price</span>
                <strong>
                  {details.deliveryZonePriceRub !== null
                    ? formatAdminPrice(details.deliveryZonePriceRub)
                    : "—"}
                </strong>
              </div>
              <div>
                <span>Distance from base</span>
                <strong>
                  {details.deliveryZoneDistanceKm !== null
                    ? `${details.deliveryZoneDistanceKm.toFixed(1)} km`
                    : "—"}
                </strong>
              </div>
              <div>
                <span>Road distance</span>
                <strong>
                  {details.deliveryZoneRoadDistanceKm !== null
                    ? `${details.deliveryZoneRoadDistanceKm.toFixed(1)} km`
                    : "—"}
                </strong>
              </div>
              <div>
                <span>Road duration</span>
                <strong>
                  {details.deliveryZoneRoadDurationMinutes !== null
                    ? `${Math.round(details.deliveryZoneRoadDurationMinutes)} min`
                    : "—"}
                </strong>
              </div>
              <div>
                <span>Zone status</span>
                <strong>{details.deliveryZoneStatus || "—"}</strong>
              </div>
              <div>
                <span>Zone detection</span>
                <strong>{details.deliveryZoneDetectionMode || "—"}</strong>
              </div>
            </>
          ) : null}
          <div className={styles.adminOrderDetailsWideField}>
            <span>Comment</span>
            <strong>{details.comment || "—"}</strong>
          </div>
        </div>
      </div>

      {details.deliveryZoneId ? (
        <div className={styles.adminOrderDetailsCard}>
          <h3 className={styles.adminOrderDetailsSubheading}>Delivery zone map</h3>
          <DeliveryZoneMap
            formatPrice={formatAdminPrice}
            selectedZoneId={details.deliveryZoneId as DeliveryZoneId}
            variant="admin"
            zoneStatus={
              details.deliveryZoneStatus === "ready"
                ? "available"
                : details.deliveryZoneStatus === "outside_delivery_area"
                  ? "outside_delivery_area"
                  : details.deliveryZoneStatus === "error"
                    ? "error"
                    : "unknown"
            }
          />
        </div>
      ) : null}

      <div className={styles.adminOrderDetailsCard}>
        <h3 className={styles.adminOrderDetailsSubheading}>Timeline</h3>
        {details.timeline.length === 0 ? (
          <p className={styles.adminOrderDetailsMuted}>No timeline events yet.</p>
        ) : (
          <ol className={styles.adminOrderTimeline}>
            {details.timeline.map((event) => (
              <li key={`${event.status}-${event.createdAt}`}>
                <div className={styles.adminOrderTimelineTop}>
                  <strong>{getOrderStatusLabel(event.status)}</strong>
                  <span>{formatTimelineDate(event.createdAt)}</span>
                </div>
                <p>
                  {event.updatedBy} · {event.source}
                  {event.visibleToCustomer ? "" : " · hidden from customer"}
                </p>
                {event.note ? <p>{event.note}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
