// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админ-панель
//
// Purpose (EN):
// Orders list and management content
//
// Назначение (RU):
// Контент управления заказами
// ==================================================
"use client";

import { AdminOrderDetailsPanel } from "@/components/admin/AdminOrderDetailsPanel";
import { AdminOrdersKanban } from "@/components/admin/AdminOrdersKanban";
import {
  bulkAssignCourier,
  bulkCancelOrders,
  bulkUpdateOrderStatus,
} from "@/components/admin/bulkAdminOrders";
import styles from "@/components/admin/AdminOrdersContent.module.css";
import panelStyles from "@/components/admin/AdminPanel.module.css";
import {
  getAllOrders,
  queryAdminOrders,
  type AdminOrderCourierFilter,
  type AdminOrderDatePreset,
  type AdminOrderRecord,
  type AdminOrderSortKey,
} from "@/components/admin/adminOrderList";
import { getDemoCouriers } from "@/components/couriers/courierModel";
import {
  getOrderStatusLabel,
  type OrderStatusId,
} from "@/components/orders/orderStatus";
import { useState, useSyncExternalStore } from "react";

const STATUS_FILTER_OPTIONS: Array<{
  value: OrderStatusId | "all";
  label: string;
}> = [
  { value: "all", label: "Все статусы" },
  { value: "CREATED", label: "Создан" },
  { value: "CONFIRMED", label: "Подтверждён" },
  { value: "PREPARING", label: "Букет собирается" },
  { value: "COURIER_ASSIGNED", label: "Курьер назначен" },
  { value: "OUT_FOR_DELIVERY", label: "Курьер в пути" },
  { value: "DELIVERED", label: "Доставлен" },
  { value: "CANCELLED", label: "Отменён" },
];

const BULK_STATUS_OPTIONS: Array<{
  value: OrderStatusId;
  label: string;
}> = STATUS_FILTER_OPTIONS.filter(
  (option): option is { value: OrderStatusId; label: string } =>
    option.value !== "all",
);

const DATE_FILTER_OPTIONS: Array<{
  value: AdminOrderDatePreset;
  label: string;
}> = [
  { value: "all", label: "Все даты" },
  { value: "today", label: "Сегодня" },
  { value: "tomorrow", label: "Завтра" },
  { value: "thisWeek", label: "Эта неделя" },
];

const SORT_OPTIONS: Array<{
  value: AdminOrderSortKey;
  label: string;
}> = [
  { value: "newest", label: "Новые сверху" },
  { value: "oldest", label: "Старые сверху" },
  { value: "deliveryDate", label: "Дата доставки" },
  { value: "status", label: "Статус" },
];

type AdminOrdersViewMode = "list" | "kanban";

function formatAdminPrice(priceRub: number): string {
  return `${priceRub.toLocaleString("ru-RU")} ₽`;
}

function formatAdminDate(order: AdminOrderRecord): string {
  if (order.createdAtDisplay?.trim()) {
    return order.createdAtDisplay.trim();
  }

  const createdAt = new Date(order.createdAt);

  if (Number.isNaN(createdAt.getTime())) {
    return order.createdAt;
  }

  return createdAt.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBulkResultMessage(
  actionLabel: string,
  result: { updatedCount: number; failedCount: number; errors: string[] },
): string {
  if (result.updatedCount === 0 && result.failedCount === 0) {
    return `No orders were updated for ${actionLabel.toLowerCase()}.`;
  }

  const summary = `${actionLabel}: ${result.updatedCount} updated`;
  const failureSummary =
    result.failedCount > 0 ? `, ${result.failedCount} failed` : "";

  if (result.errors.length === 0) {
    return `${summary}${failureSummary}.`;
  }

  return `${summary}${failureSummary}. ${result.errors[0]}`;
}

export function AdminOrdersContent() {
  const demoCouriers = getDemoCouriers();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [ordersRevision, setOrdersRevision] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatusId | "all">("all");
  const [courierFilter, setCourierFilter] =
    useState<AdminOrderCourierFilter>("all");
  const [datePreset, setDatePreset] = useState<AdminOrderDatePreset>("all");
  const [sortBy, setSortBy] = useState<AdminOrderSortKey>("newest");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatusId>("CONFIRMED");
  const [bulkCourierId, setBulkCourierId] = useState(
    demoCouriers[0]?.id ?? "",
  );
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkNotice, setBulkNotice] = useState("");
  const [viewMode, setViewMode] = useState<AdminOrdersViewMode>("list");
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  void ordersRevision;

  const allOrders = isClient ? getAllOrders() : [];
  const filteredOrders = isClient
    ? queryAdminOrders({
        searchQuery,
        status: statusFilter,
        courier: courierFilter,
        datePreset,
        sortBy,
      })
    : [];
  const visibleOrderIds = filteredOrders.map((order) => order.orderId);
  const selectedVisibleCount = visibleOrderIds.filter((orderId) =>
    selectedOrderIds.includes(orderId),
  ).length;
  const allVisibleSelected =
    visibleOrderIds.length > 0 &&
    selectedVisibleCount === visibleOrderIds.length;
  const hasSelection = selectedOrderIds.length > 0;

  const clearSelection = () => {
    setSelectedOrderIds([]);
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((current) =>
      current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId],
    );
  };

  const selectAllVisible = () => {
    setSelectedOrderIds(visibleOrderIds);
  };

  const refreshOrders = () => {
    setOrdersRevision((current) => current + 1);
  };

  const finishBulkAction = (
    actionLabel: string,
    result: { updatedCount: number; failedCount: number; errors: string[] },
  ) => {
    if (result.updatedCount > 0) {
      refreshOrders();
      clearSelection();
    }

    if (result.updatedCount > 0 && result.failedCount === 0) {
      setBulkNotice(formatBulkResultMessage(actionLabel, result));
      setBulkError("");
      return;
    }

    if (result.updatedCount > 0 && result.failedCount > 0) {
      setBulkNotice(`${actionLabel}: ${result.updatedCount} updated.`);
      setBulkError(
        result.errors.length > 0
          ? `${result.failedCount} failed. ${result.errors[0]}`
          : `${result.failedCount} failed.`,
      );
      return;
    }

    setBulkNotice("");
    setBulkError(formatBulkResultMessage(actionLabel, result));
  };

  const handleBulkStatusApply = () => {
    if (!hasSelection || isApplyingBulk) {
      return;
    }

    setBulkError("");
    setBulkNotice("");
    setIsApplyingBulk(true);

    const result = bulkUpdateOrderStatus(selectedOrderIds, bulkStatus);
    finishBulkAction("Bulk status update", result);
    setIsApplyingBulk(false);
  };

  const handleBulkCourierAssign = () => {
    if (!hasSelection || isApplyingBulk || !bulkCourierId) {
      return;
    }

    setBulkError("");
    setBulkNotice("");
    setIsApplyingBulk(true);

    const result = bulkAssignCourier(selectedOrderIds, bulkCourierId);
    finishBulkAction("Bulk courier assignment", result);
    setIsApplyingBulk(false);
  };

  const handleBulkCancel = () => {
    if (!hasSelection || isApplyingBulk) {
      return;
    }

    const confirmed = window.confirm(
      `Cancel ${selectedOrderIds.length} selected order${
        selectedOrderIds.length === 1 ? "" : "s"
      }?`,
    );

    if (!confirmed) {
      return;
    }

    setBulkError("");
    setBulkNotice("");
    setIsApplyingBulk(true);

    const result = bulkCancelOrders(selectedOrderIds);
    finishBulkAction("Bulk cancel", result);
    setIsApplyingBulk(false);
  };

  if (selectedOrderId) {
    return (
      <AdminOrderDetailsPanel
        orderId={selectedOrderId}
        orders={allOrders}
        onBack={() => setSelectedOrderId(null)}
        onOrderUpdated={() => refreshOrders()}
      />
    );
  }

  return (
    <section
      className={panelStyles.adminOrdersSection}
      aria-labelledby="admin-orders-title"
    >
      <div className={panelStyles.adminOrdersHeader}>
        <div>
          <p className={panelStyles.adminPlaceholderEyebrow}>Operations</p>
          <h2 id="admin-orders-title" className={panelStyles.adminPlaceholderTitle}>
            Orders
          </h2>
        </div>
        <p className={panelStyles.adminOrdersCount}>
          {filteredOrders.length} of {allOrders.length} orders
        </p>
      </div>

      <div className={styles.viewSwitcher} role="group" aria-label="Orders view mode">
        <button
          type="button"
          className={`${styles.viewSwitcherButton} ${
            viewMode === "list" ? styles.viewSwitcherButtonActive : ""
          }`}
          aria-pressed={viewMode === "list"}
          onClick={() => setViewMode("list")}
        >
          List
        </button>
        <button
          type="button"
          className={`${styles.viewSwitcherButton} ${
            viewMode === "kanban" ? styles.viewSwitcherButtonActive : ""
          }`}
          aria-pressed={viewMode === "kanban"}
          onClick={() => setViewMode("kanban")}
        >
          Kanban
        </button>
      </div>

      <div className={styles.crmControls}>
        <label className={styles.filterField}>
          <span className={styles.filterLabel}>Search</span>
          <input
            type="search"
            className={styles.searchInput}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="ID, клиент, телефон, букет, адрес"
            aria-label="Search orders"
          />
        </label>

        <div className={styles.filtersGrid}>
          <label className={styles.filterField}>
            <span className={styles.filterLabel}>Status</span>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as OrderStatusId | "all")
              }
              aria-label="Filter by status"
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.filterField}>
            <span className={styles.filterLabel}>Courier</span>
            <select
              className={styles.filterSelect}
              value={courierFilter}
              onChange={(event) =>
                setCourierFilter(event.target.value as AdminOrderCourierFilter)
              }
              aria-label="Filter by courier"
            >
              <option value="all">Все курьеры</option>
              <option value="unassigned">Not assigned</option>
              {demoCouriers.map((courier) => (
                <option key={courier.id} value={courier.id}>
                  {courier.fullName}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.filterField}>
            <span className={styles.filterLabel}>Delivery date</span>
            <select
              className={styles.filterSelect}
              value={datePreset}
              onChange={(event) =>
                setDatePreset(event.target.value as AdminOrderDatePreset)
              }
              aria-label="Filter by delivery date"
            >
              {DATE_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.filterField}>
            <span className={styles.filterLabel}>Sort</span>
            <select
              className={styles.filterSelect}
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as AdminOrderSortKey)
              }
              aria-label="Sort orders"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className={styles.resultsSummary}>
          Showing {filteredOrders.length} order
          {filteredOrders.length === 1 ? "" : "s"}
        </p>
      </div>

      {viewMode === "list" && filteredOrders.length > 0 ? (
        <div className={styles.selectionControls}>
          <button
            type="button"
            className={styles.selectionButton}
            onClick={selectAllVisible}
            disabled={allVisibleSelected}
          >
            Select all visible
          </button>
          <button
            type="button"
            className={styles.selectionButton}
            onClick={clearSelection}
            disabled={!hasSelection}
          >
            Clear selection
          </button>
          {hasSelection ? (
            <p className={styles.resultsSummary}>
              {selectedOrderIds.length} selected
            </p>
          ) : null}
        </div>
      ) : null}

      {viewMode === "list" && hasSelection ? (
        <section className={styles.bulkActionBar} aria-label="Bulk order actions">
          <p className={styles.bulkActionHeading}>
            Bulk actions for {selectedOrderIds.length} selected order
            {selectedOrderIds.length === 1 ? "" : "s"}
          </p>

          <div className={styles.bulkActionRow}>
            <div className={styles.bulkActionGroup}>
              <label className={styles.bulkActionLabel} htmlFor="bulk-status">
                Change status
              </label>
              <select
                id="bulk-status"
                className={styles.filterSelect}
                value={bulkStatus}
                onChange={(event) =>
                  setBulkStatus(event.target.value as OrderStatusId)
                }
                disabled={isApplyingBulk}
              >
                {BULK_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className={styles.bulkActionButton}
              onClick={handleBulkStatusApply}
              disabled={isApplyingBulk}
            >
              Apply status
            </button>
          </div>

          <div className={styles.bulkActionRow}>
            <div className={styles.bulkActionGroup}>
              <label className={styles.bulkActionLabel} htmlFor="bulk-courier">
                Assign courier
              </label>
              <select
                id="bulk-courier"
                className={styles.filterSelect}
                value={bulkCourierId}
                onChange={(event) => setBulkCourierId(event.target.value)}
                disabled={isApplyingBulk}
              >
                {demoCouriers.map((courier) => (
                  <option key={courier.id} value={courier.id}>
                    {courier.fullName}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className={styles.bulkActionButton}
              onClick={handleBulkCourierAssign}
              disabled={isApplyingBulk || !bulkCourierId}
            >
              Assign courier
            </button>
          </div>

          <div className={styles.bulkActionRow}>
            <button
              type="button"
              className={`${styles.bulkActionButton} ${styles.bulkCancelButton}`}
              onClick={handleBulkCancel}
              disabled={isApplyingBulk}
            >
              Cancel selected
            </button>
          </div>

          {bulkError ? (
            <p className={styles.bulkError} role="alert">
              {bulkError}
            </p>
          ) : null}
          {bulkNotice ? (
            <p className={styles.bulkNotice} role="status">
              {bulkNotice}
            </p>
          ) : null}
        </section>
      ) : null}

      {allOrders.length === 0 ? (
        <div className={panelStyles.adminOrdersEmpty}>
          <p>No orders yet.</p>
          <span>Local checkout orders will appear here.</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className={styles.filteredEmpty}>
          <p>No matching orders.</p>
          <span>Try changing search text or filters.</span>
        </div>
      ) : viewMode === "kanban" ? (
        <AdminOrdersKanban
          orders={filteredOrders}
          onOrderSelect={setSelectedOrderId}
          onOrderUpdated={refreshOrders}
        />
      ) : (
        <ul className={panelStyles.adminOrdersList}>
          {filteredOrders.map((order) => {
            const primaryItem = order.items[0];
            const isSelected = selectedOrderIds.includes(order.orderId);

            return (
              <li key={order.orderId} className={styles.orderRow}>
                <label className={styles.orderSelect}>
                  <input
                    type="checkbox"
                    className={styles.orderCheckbox}
                    checked={isSelected}
                    onChange={() => toggleOrderSelection(order.orderId)}
                    aria-label={`Select order ${order.orderId}`}
                  />
                </label>

                <button
                  type="button"
                  className={`${panelStyles.adminOrdersCardButton} ${styles.orderOpenButton}`}
                  onClick={() => setSelectedOrderId(order.orderId)}
                >
                  <div className={panelStyles.adminOrdersCardTop}>
                    <strong>{order.orderId}</strong>
                    <span className={panelStyles.adminOrdersStatusBadge}>
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </div>

                  <div className={panelStyles.adminOrdersMetaGrid}>
                    <div>
                      <span>Customer</span>
                      <strong>{order.customerName}</strong>
                    </div>
                    <div>
                      <span>Phone</span>
                      <strong>{order.customerPhone}</strong>
                    </div>
                    <div>
                      <span>Bouquet</span>
                      <strong>{primaryItem?.bouquetName ?? "—"}</strong>
                    </div>
                    <div>
                      <span>Total</span>
                      <strong>{formatAdminPrice(order.totalPriceRub)}</strong>
                    </div>
                    <div>
                      <span>Delivery</span>
                      <strong>
                        {order.deliveryDate}
                        {order.deliveryTime ? ` · ${order.deliveryTime}` : ""}
                      </strong>
                    </div>
                    <div>
                      <span>Created</span>
                      <strong>{formatAdminDate(order)}</strong>
                    </div>
                    <div>
                      <span>Courier</span>
                      <strong>{order.assignedCourierName ?? "Not assigned"}</strong>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
