// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админ-панель
//
// Purpose (EN):
// Courier workspace for assigned orders and status updates
//
// Назначение (RU):
// Рабочее место курьера для заказов и статусов
// ==================================================
"use client";

import styles from "@/components/couriers/CourierWorkspace.module.css";
import {
  getActiveCourierOrders,
  getDeliveredCourierOrders,
  isNewCourierAssignment,
} from "@/components/couriers/courierOrders";
import {
  findCourierById,
  getDemoCouriers,
} from "@/components/couriers/courierModel";
import { CourierLocationPanel } from "@/components/couriers/CourierLocationPanel";
import {
  patchStoredAdminOrder,
  type AdminOrderRecord,
} from "@/components/admin/adminOrderList";
import {
  getOrderStatusLabel,
  type OrderStatusId,
} from "@/components/orders/orderStatus";
import { updateOrderStatus } from "@/components/orders/updateOrderStatus";
import { submitTelegramStatusUpdate } from "@/components/telegram/submitTelegramStatusUpdate";
import { useState, useSyncExternalStore } from "react";

type CourierOrderCardProps = {
  order: AdminOrderRecord;
  updatingOrderId: string | null;
  onStatusChange: (
    order: AdminOrderRecord,
    nextStatus: OrderStatusId,
  ) => Promise<void>;
  readOnly?: boolean;
};

function CourierOrderCard({
  order,
  updatingOrderId,
  onStatusChange,
  readOnly = false,
}: CourierOrderCardProps) {
  const primaryItem = order.items[0];
  const isUpdating = updatingOrderId === order.orderId;
  const showNewOrderBadge = isNewCourierAssignment(order);
  const canMarkOutForDelivery = order.status === "COURIER_ASSIGNED";
  const canMarkDelivered = order.status === "OUT_FOR_DELIVERY";

  return (
    <li className={styles.orderCard}>
      <div className={styles.orderCardTop}>
        <strong>{order.orderId}</strong>
        <div className={styles.orderBadges}>
          {showNewOrderBadge ? (
            <span className={styles.newOrderBadge}>Новый заказ</span>
          ) : null}
          <span className={styles.statusBadge}>
            {getOrderStatusLabel(order.status)}
          </span>
        </div>
      </div>

      <div className={styles.metaGrid}>
        <div>
          <span>Bouquet</span>
          <strong>{primaryItem?.bouquetName ?? "—"}</strong>
        </div>
        <div>
          <span>Delivery address</span>
          <strong>{order.deliveryAddress || "—"}</strong>
        </div>
        <div>
          <span>Delivery date</span>
          <strong>{order.deliveryDate || "—"}</strong>
        </div>
        <div>
          <span>Delivery interval</span>
          <strong>{order.deliveryTime || "—"}</strong>
        </div>
        <div>
          <span>Phone</span>
          <strong>{order.customerPhone}</strong>
        </div>
        <div>
          <span>Customer</span>
          <strong>{order.customerName}</strong>
        </div>
      </div>

      {!readOnly ? (
        <div className={styles.orderActions}>
          {canMarkOutForDelivery ? (
            <button
              type="button"
              className={styles.actionButton}
              disabled={Boolean(updatingOrderId)}
              onClick={() => void onStatusChange(order, "OUT_FOR_DELIVERY")}
            >
              {isUpdating ? "Updating..." : "Out for delivery"}
            </button>
          ) : null}
          {canMarkDelivered ? (
            <button
              type="button"
              className={styles.actionButton}
              disabled={Boolean(updatingOrderId)}
              onClick={() => void onStatusChange(order, "DELIVERED")}
            >
              {isUpdating ? "Updating..." : "Delivered"}
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function CourierWorkspace() {
  const demoCouriers = getDemoCouriers();
  const [selectedCourierId, setSelectedCourierId] = useState(
    demoCouriers[0]?.id ?? "",
  );
  const [ordersRevision, setOrdersRevision] = useState(0);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  void ordersRevision;

  const selectedCourier = findCourierById(selectedCourierId);
  const activeOrders = isClient
    ? getActiveCourierOrders(selectedCourierId)
    : [];
  const deliveredOrders = isClient
    ? getDeliveredCourierOrders(selectedCourierId)
    : [];

  const handleCourierStatusChange = async (
    order: AdminOrderRecord,
    nextStatus: OrderStatusId,
  ) => {
    if (!selectedCourier || updatingOrderId) {
      return;
    }

    setActionError("");
    setActionNotice("");
    setUpdatingOrderId(order.orderId);

    const result = updateOrderStatus(order, nextStatus, {
      updatedBy: selectedCourier.fullName,
      source: "courier",
      visibleToCustomer: true,
    });

    if (!result.ok) {
      setActionError(result.error);
      setUpdatingOrderId(null);
      return;
    }

    const saved = patchStoredAdminOrder(order.orderId, {
      status: result.order.status,
      timeline: result.order.timeline,
      updatedAt: result.order.updatedAt,
    });

    if (!saved) {
      setActionError("Unable to save courier status update locally.");
      setUpdatingOrderId(null);
      return;
    }

    setOrdersRevision((current) => current + 1);

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
      setActionNotice(
        `Status saved locally. Telegram notification failed: ${telegramResult.message}`,
      );
    }

    setUpdatingOrderId(null);
  };

  return (
    <div className={styles.workspaceShell}>
      {/* ==================================================
SECTION: ADMIN
РАЗДЕЛ: Заголовок рабочего места курьера
Purpose (EN): Workspace header
Назначение (RU): Заголовок рабочего места курьера
================================================== */}
      <header className={styles.workspaceHeader}>
        <p className={styles.workspaceEyebrow}>BellaFlore</p>
        <h1 className={styles.workspaceTitle}>Courier Workspace</h1>
        <p className={styles.workspaceSubtitle}>
          Demo courier view for assigned orders only.
        </p>
      </header>

      {/* ==================================================
SECTION: ADMIN
РАЗДЕЛ: Переключатель курьеров
Purpose (EN): Courier selector tabs
Назначение (RU): Переключатель курьеров
================================================== */}
      <section className={styles.selectorCard} aria-label="Courier selector">
        <p className={styles.selectorLabel}>Select courier</p>
        <div className={styles.courierSelector} role="group">
          {demoCouriers.map((courier) => (
            <button
              key={courier.id}
              type="button"
              className={`${styles.courierSelectorButton} ${
                selectedCourierId === courier.id
                  ? styles.courierSelectorButtonActive
                  : ""
              }`}
              onClick={() => {
                setSelectedCourierId(courier.id);
                setActionError("");
                setActionNotice("");
              }}
            >
              {courier.fullName}
            </button>
          ))}
        </div>
      </section>

      {selectedCourier ? (
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionHeading}>{selectedCourier.fullName}</h2>
          <p className={styles.sectionCount}>
            {activeOrders.length} active · {deliveredOrders.length} delivered
          </p>
        </section>
      ) : null}

      {selectedCourier ? (
        <CourierLocationPanel key={selectedCourier.id} courier={selectedCourier} />
      ) : null}

      {/* ==================================================
SECTION: MY ORDER
РАЗДЕЛ: Список активных назначенных заказов
Purpose (EN): Active assigned orders list
Назначение (RU): Список активных назначенных заказов
================================================== */}
      <section className={styles.sectionCard} aria-labelledby="active-orders">
        <h2 id="active-orders" className={styles.sectionHeading}>
          Active orders
        </h2>
        {activeOrders.length === 0 ? (
          <p className={styles.emptyState}>Нет активных заказов</p>
        ) : (
          <ul className={styles.ordersList}>
            {activeOrders.map((order) =>
              selectedCourier ? (
                <CourierOrderCard
                  key={order.orderId}
                  order={order}
                  updatingOrderId={updatingOrderId}
                  onStatusChange={handleCourierStatusChange}
                />
              ) : null,
            )}
          </ul>
        )}
        {actionError ? (
          <p className={styles.error} role="alert">
            {actionError}
          </p>
        ) : null}
        {actionNotice ? (
          <p className={styles.notice} role="status">
            {actionNotice}
          </p>
        ) : null}
      </section>

      {/* ==================================================
SECTION: MY ORDER
РАЗДЕЛ: История доставленных заказов
Purpose (EN): Delivered orders history
Назначение (RU): История доставленных заказов
================================================== */}
      <section className={styles.sectionCard} aria-labelledby="delivered-orders">
        <h2 id="delivered-orders" className={styles.sectionHeading}>
          Delivered orders
        </h2>
        {deliveredOrders.length === 0 ? (
          <p className={styles.emptyState}>Нет доставленных заказов</p>
        ) : (
          <ul className={styles.ordersList}>
            {deliveredOrders.map((order) =>
              selectedCourier ? (
                <CourierOrderCard
                  key={order.orderId}
                  order={order}
                  updatingOrderId={updatingOrderId}
                  onStatusChange={handleCourierStatusChange}
                  readOnly
                />
              ) : null,
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
