// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админ-панель
//
// Purpose (EN):
// Kanban board for order status workflow
//
// Назначение (RU):
// Канбан-доска статусов заказов
// ==================================================
"use client";

import styles from "@/components/admin/AdminOrdersKanban.module.css";
import {
  groupOrdersForKanban,
  patchStoredAdminOrder,
  type AdminOrderRecord,
} from "@/components/admin/adminOrderList";
import {
  canCancelFromKanban,
  getNextKanbanStatus,
  getOrderStatus,
  getOrderStatusLabel,
  getPreviousKanbanStatus,
  isKanbanDraggable,
  isValidKanbanDragTarget,
  type OrderStatusId,
} from "@/components/orders/orderStatus";
import { updateOrderStatus } from "@/components/orders/updateOrderStatus";
import { submitTelegramStatusUpdate } from "@/components/telegram/submitTelegramStatusUpdate";
import { useRef, useState, type DragEvent } from "react";

type AdminOrdersKanbanProps = {
  orders: AdminOrderRecord[];
  onOrderSelect: (orderId: string) => void;
  onOrderUpdated: () => void;
};

type KanbanOrderCardProps = {
  order: AdminOrderRecord;
  updatingOrderId: string | null;
  isDragging: boolean;
  onOrderSelect: (orderId: string) => void;
  onStatusChange: (
    order: AdminOrderRecord,
    nextStatus: OrderStatusId,
  ) => Promise<boolean>;
  onCancel: (order: AdminOrderRecord) => Promise<void>;
  onDragStart: (event: DragEvent<HTMLLIElement>, order: AdminOrderRecord) => void;
  onDragEnd: () => void;
};

function formatKanbanPrice(priceRub: number): string {
  return `${priceRub.toLocaleString("ru-RU")} ₽`;
}

function KanbanOrderCard({
  order,
  updatingOrderId,
  isDragging,
  onOrderSelect,
  onStatusChange,
  onCancel,
  onDragStart,
  onDragEnd,
}: KanbanOrderCardProps) {
  const didDragRef = useRef(false);
  const primaryItem = order.items[0];
  const previousStatus = getPreviousKanbanStatus(order.status);
  const nextStatus = getNextKanbanStatus(order.status);
  const showCancel = canCancelFromKanban(order.status);
  const isUpdating = updatingOrderId === order.orderId;
  const isDraggable = isKanbanDraggable(order.status) && !updatingOrderId;

  const handleOpenOrder = () => {
    if (didDragRef.current) {
      return;
    }

    onOrderSelect(order.orderId);
  };

  return (
    <li
      className={`${styles.kanbanCard} ${
        isDraggable ? styles.kanbanCardDraggable : ""
      } ${isDragging ? styles.kanbanCardDragging : ""}`}
      draggable={isDraggable}
      onDragStart={(event) => {
        didDragRef.current = true;
        onDragStart(event, order);
      }}
      onDragEnd={() => {
        onDragEnd();
        window.setTimeout(() => {
          didDragRef.current = false;
        }, 0);
      }}
    >
      <button
        type="button"
        className={styles.kanbanCardOpen}
        onClick={handleOpenOrder}
      >
        <div className={styles.kanbanCardTop}>
          <strong>{order.orderId}</strong>
          <span className={styles.kanbanStatusBadge}>
            {getOrderStatusLabel(order.status)}
          </span>
        </div>

        <div className={styles.kanbanCardMeta}>
          <div>
            <span>Bouquet</span>
            <strong>{primaryItem?.bouquetName ?? "—"}</strong>
          </div>
          <div>
            <span>Customer</span>
            <strong>{order.customerName}</strong>
          </div>
          <div>
            <span>Phone</span>
            <strong>{order.customerPhone}</strong>
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
            <span>Courier</span>
            <strong>{order.assignedCourierName ?? "Not assigned"}</strong>
          </div>
        </div>

        <p className={styles.kanbanCardPrice}>
          {formatKanbanPrice(order.totalPriceRub)}
        </p>
      </button>

      {previousStatus || nextStatus || showCancel ? (
        <div
          className={styles.kanbanCardActions}
          onClick={(event) => event.stopPropagation()}
        >
          {previousStatus ? (
            <button
              type="button"
              className={styles.kanbanActionButton}
              disabled={Boolean(updatingOrderId)}
              draggable={false}
              onDragStart={(event) => event.preventDefault()}
              onClick={() => void onStatusChange(order, previousStatus)}
            >
              {isUpdating ? "..." : "Назад"}
            </button>
          ) : null}
          {nextStatus ? (
            <button
              type="button"
              className={styles.kanbanActionButton}
              disabled={Boolean(updatingOrderId)}
              draggable={false}
              onDragStart={(event) => event.preventDefault()}
              onClick={() => void onStatusChange(order, nextStatus)}
            >
              {isUpdating ? "..." : "Дальше"}
            </button>
          ) : null}
          {showCancel ? (
            <button
              type="button"
              className={`${styles.kanbanActionButton} ${styles.kanbanCancelButton}`}
              disabled={Boolean(updatingOrderId)}
              draggable={false}
              onDragStart={(event) => event.preventDefault()}
              onClick={() => void onCancel(order)}
            >
              {isUpdating ? "..." : "Отменить"}
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function AdminOrdersKanban({
  orders,
  onOrderSelect,
  onOrderUpdated,
}: AdminOrdersKanbanProps) {
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<OrderStatusId | null>(
    null,
  );
  const columns = groupOrdersForKanban(orders);
  const draggedOrder =
    draggedOrderId === null
      ? null
      : (orders.find((order) => order.orderId === draggedOrderId) ?? null);

  const applyKanbanStatusChange = async (
    order: AdminOrderRecord,
    nextStatus: OrderStatusId,
  ): Promise<boolean> => {
    if (updatingOrderId) {
      return false;
    }

    const currentStatusId = getOrderStatus(order.status)?.id;

    if (currentStatusId === nextStatus) {
      return true;
    }

    setActionError("");
    setActionNotice("");
    setUpdatingOrderId(order.orderId);

    const result = updateOrderStatus(order, nextStatus, {
      updatedBy: "Admin",
      source: "admin",
      visibleToCustomer: true,
    });

    if (!result.ok) {
      setActionError(result.error);
      setUpdatingOrderId(null);
      return false;
    }

    const saved = patchStoredAdminOrder(order.orderId, {
      status: result.order.status,
      timeline: result.order.timeline,
      updatedAt: result.order.updatedAt,
    });

    if (!saved) {
      setActionError("Unable to save the updated order locally.");
      setUpdatingOrderId(null);
      return false;
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
      setActionNotice(
        `Status saved locally. Telegram notification failed: ${telegramResult.message}`,
      );
    }

    setUpdatingOrderId(null);
    return true;
  };

  const handleCancel = async (order: AdminOrderRecord) => {
    const confirmed = window.confirm(`Отменить заказ ${order.orderId}?`);

    if (!confirmed) {
      return;
    }

    await applyKanbanStatusChange(order, "CANCELLED");
  };

  const handleDragStart = (
    event: DragEvent<HTMLLIElement>,
    order: AdminOrderRecord,
  ) => {
    if (!isKanbanDraggable(order.status) || updatingOrderId) {
      event.preventDefault();
      return;
    }

    setDraggedOrderId(order.orderId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", order.orderId);
  };

  const handleDragEnd = () => {
    setDraggedOrderId(null);
    setDragOverStatus(null);
  };

  const handleColumnDragOver = (
    event: DragEvent<HTMLElement>,
    columnStatus: OrderStatusId,
  ) => {
    event.preventDefault();

    if (!draggedOrder) {
      return;
    }

    if (isValidKanbanDragTarget(draggedOrder.status, columnStatus)) {
      event.dataTransfer.dropEffect = "move";
      setDragOverStatus(columnStatus);
      return;
    }

    event.dataTransfer.dropEffect = "none";
    setDragOverStatus(columnStatus);
  };

  const handleColumnDragLeave = (
    event: DragEvent<HTMLElement>,
    columnStatus: OrderStatusId,
  ) => {
    const relatedTarget = event.relatedTarget;

    if (
      relatedTarget instanceof Node &&
      event.currentTarget.contains(relatedTarget)
    ) {
      return;
    }

    if (dragOverStatus === columnStatus) {
      setDragOverStatus(null);
    }
  };

  const handleColumnDrop = async (
    event: DragEvent<HTMLElement>,
    columnStatus: OrderStatusId,
  ) => {
    event.preventDefault();
    setDragOverStatus(null);

    const orderId = event.dataTransfer.getData("text/plain").trim();
    const order = orders.find((entry) => entry.orderId === orderId);

    if (!order) {
      setActionError("Unable to find the dragged order.");
      setDraggedOrderId(null);
      return;
    }

    if (!isValidKanbanDragTarget(order.status, columnStatus)) {
      setActionError("This column is not a valid drag target for this order.");
      setDraggedOrderId(null);
      return;
    }

    setDraggedOrderId(null);
    await applyKanbanStatusChange(order, columnStatus);
  };

  return (
    <div className={styles.kanbanBoard} aria-label="Orders kanban board">
      {actionError ? (
        <p className={styles.kanbanNoticeError} role="alert">
          {actionError}
        </p>
      ) : null}
      {actionNotice ? (
        <p className={styles.kanbanNotice} role="status">
          {actionNotice}
        </p>
      ) : null}

      <div className={styles.kanbanColumns}>
        {columns.map((column) => {
          const isDragOver = dragOverStatus === column.status;
          const isValidDrop =
            draggedOrder !== null &&
            isValidKanbanDragTarget(draggedOrder.status, column.status);

          return (
            <section
              key={column.status}
              className={`${styles.kanbanColumn} ${
                isDragOver && isValidDrop ? styles.kanbanColumnDragOver : ""
              } ${isDragOver && !isValidDrop ? styles.kanbanColumnDragInvalid : ""}`}
              aria-label={`${column.label} orders`}
              onDragOver={(event) => handleColumnDragOver(event, column.status)}
              onDragLeave={(event) =>
                handleColumnDragLeave(event, column.status)
              }
              onDrop={(event) => void handleColumnDrop(event, column.status)}
            >
              <div className={styles.kanbanColumnHeader}>
                <h3 className={styles.kanbanColumnTitle}>{column.label}</h3>
                <span className={styles.kanbanColumnCount}>
                  {column.orders.length}
                </span>
              </div>

              <div className={styles.kanbanDropZone}>
                {column.orders.length === 0 ? (
                  <p className={styles.kanbanEmptyColumn}>Нет заказов</p>
                ) : (
                  <ul className={styles.kanbanCards}>
                    {column.orders.map((order) => (
                      <KanbanOrderCard
                        key={order.orderId}
                        order={order}
                        updatingOrderId={updatingOrderId}
                        isDragging={draggedOrderId === order.orderId}
                        onOrderSelect={onOrderSelect}
                        onStatusChange={applyKanbanStatusChange}
                        onCancel={handleCancel}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
