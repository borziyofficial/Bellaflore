// ==================================================
// SECTION: ADMIN APP — Orders module
// ==================================================
"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminModuleHeader, AdminPanel, AdminStatCard } from "@/components/adminApp/shared/AdminModuleUi";
import ui from "@/components/adminApp/shared/AdminModuleUi.module.css";
import styles from "@/components/adminApp/modules/orders/AdminOrdersModule.module.css";

const ORDER_STATUSES = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "COURIER_ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

type AdminOrderStatus = (typeof ORDER_STATUSES)[number];

type AdminOrderItem = {
  id: string;
  productId: string;
  productSlug: string;
  name: string;
  size: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

type AdminOrder = {
  id: string;
  orderNumber: string;
  status: AdminOrderStatus;
  createdAt: string;
  updatedAt: string;
  customer: {
    name: string;
    phone: string;
  };
  recipient: {
    name: string;
    phone: string;
  };
  delivery: {
    address: string;
    zoneId: string;
    date: string;
    interval: string;
  };
  paymentMethod: string;
  customerComment: string;
  subtotal: number;
  deliveryCost: number;
  total: number;
  currency: "RUB";
  items: AdminOrderItem[];
};

const STATUS_LABELS: Record<AdminOrderStatus, string> = {
  NEW: "Новый",
  CONFIRMED: "Подтверждён",
  PREPARING: "Собирается",
  COURIER_ASSIGNED: "Курьер назначен",
  OUT_FOR_DELIVERY: "В доставке",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

const STATUS_TABS = [
  { id: "ALL", label: "Все" },
  ...ORDER_STATUSES.map((status) => ({ id: status, label: STATUS_LABELS[status] })),
] as const;

function formatMoney(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function paymentLabel(value: string): string {
  if (value === "cashOnDelivery") {
    return "При получении";
  }
  if (value === "cardTransfer") {
    return "Переводом";
  }
  return value;
}

async function readJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    credentials: "same-origin",
  });
  const body = (await response.json().catch(() => null)) as
    | T
    | { error?: { message?: string }; message?: string }
    | null;
  if (!response.ok) {
    const errorBody =
      body && typeof body === "object"
        ? (body as { error?: { message?: string }; message?: string })
        : null;
    const message =
      errorBody?.error?.message ?? errorBody?.message ?? null;
    throw new Error(message || "Не удалось загрузить заказы.");
  }
  return body as T;
}

export function AdminOrdersModule() {
  const [activeStatus, setActiveStatus] = useState<"ALL" | AdminOrderStatus>("ALL");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? orders[0] ?? null,
    [orders, selectedOrderId],
  );

  const filteredOrders = useMemo(
    () =>
      activeStatus === "ALL"
        ? orders
        : orders.filter((order) => order.status === activeStatus),
    [activeStatus, orders],
  );

  async function loadOrders() {
    setLoading(true);
    setErrorMessage("");
    try {
      const payload = await readJson<{ orders: AdminOrder[] }>("/api/admin/orders?limit=100");
      setOrders(payload.orders);
      setSelectedOrderId((current) =>
        current && payload.orders.some((order) => order.id === current)
          ? current
          : (payload.orders[0]?.id ?? ""),
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Не удалось загрузить заказы.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(order: AdminOrder, status: AdminOrderStatus) {
    setSavingStatus(true);
    setErrorMessage("");
    try {
      const payload = await readJson<{ order: AdminOrder }>(
        `/api/admin/orders/${encodeURIComponent(order.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      setOrders((current) =>
        current.map((item) => (item.id === payload.order.id ? payload.order : item)),
      );
      setSelectedOrderId(payload.order.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Не удалось обновить статус.");
    } finally {
      setSavingStatus(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOrders();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const newCount = orders.filter((order) => order.status === "NEW").length;
  const inProgressCount = orders.filter((order) =>
    ["CONFIRMED", "PREPARING", "COURIER_ASSIGNED", "OUT_FOR_DELIVERY"].includes(order.status),
  ).length;
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className={ui.stack}>
      <AdminModuleHeader
        title="Заказы"
        subtitle="Реальные production orders из orders/order_items"
        action={
          <button className={ui.actionButton} type="button" onClick={loadOrders}>
            Обновить
          </button>
        }
      />

      <div className={ui.statGrid}>
        <AdminStatCard label="Всего" value={String(orders.length)} hint="Последние 100 заказов" />
        <AdminStatCard label="Новые" value={String(newCount)} hint="Ожидают обработки" />
        <AdminStatCard label="В работе" value={String(inProgressCount)} hint="Активная доставка" />
        <AdminStatCard label="Сумма" value={formatMoney(revenue)} hint="По загруженному списку" />
      </div>

      <div className={ui.tabRow} role="tablist" aria-label="Статус заказа">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeStatus === tab.id}
            className={`${ui.tabChip} ${activeStatus === tab.id ? ui.tabChipActive : ""}`}
            onClick={() => setActiveStatus(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}

      <div className={styles.layout}>
        <AdminPanel title={loading ? "Загружаем заказы…" : `Заказы (${filteredOrders.length})`}>
          {filteredOrders.length === 0 ? (
            <div className={ui.emptyZone}>Заказов в этом статусе пока нет.</div>
          ) : (
            <div className={styles.orderList}>
              {filteredOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className={`${styles.orderCard} ${
                    selectedOrder?.id === order.id ? styles.orderCardActive : ""
                  }`}
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <span className={styles.orderCardHeader}>
                    <strong>{order.orderNumber}</strong>
                    <span>{STATUS_LABELS[order.status]}</span>
                  </span>
                  <span>{formatDateTime(order.createdAt)}</span>
                  <span>{order.customer.name} · {order.customer.phone}</span>
                  <span>{order.delivery.date} · {order.delivery.interval}</span>
                  <strong>{formatMoney(order.total)}</strong>
                </button>
              ))}
            </div>
          )}
        </AdminPanel>

        <AdminPanel title="Детали заказа">
          {!selectedOrder ? (
            <div className={ui.emptyZone}>Выберите заказ из списка.</div>
          ) : (
            <article className={styles.detail} aria-label={`Детали заказа ${selectedOrder.orderNumber}`}>
              <div className={styles.detailHeader}>
                <div>
                  <p className={styles.eyebrow}>Order ID</p>
                  <h3>{selectedOrder.orderNumber}</h3>
                  <p>{selectedOrder.id}</p>
                </div>
                <label className={styles.statusControl}>
                  <span>Статус</span>
                  <select
                    value={selectedOrder.status}
                    disabled={savingStatus}
                    onChange={(event) =>
                      updateStatus(selectedOrder, event.target.value as AdminOrderStatus)
                    }
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <dl className={styles.facts}>
                <div><dt>Создан</dt><dd>{formatDateTime(selectedOrder.createdAt)}</dd></div>
                <div><dt>Клиент</dt><dd>{selectedOrder.customer.name}</dd></div>
                <div><dt>Телефон</dt><dd>{selectedOrder.customer.phone}</dd></div>
                <div><dt>Получатель</dt><dd>{selectedOrder.recipient.name}</dd></div>
                <div><dt>Адрес</dt><dd>{selectedOrder.delivery.address}</dd></div>
                <div><dt>Доставка</dt><dd>{selectedOrder.delivery.date} · {selectedOrder.delivery.interval}</dd></div>
                <div><dt>Зона</dt><dd>{selectedOrder.delivery.zoneId}</dd></div>
                <div><dt>Оплата</dt><dd>{paymentLabel(selectedOrder.paymentMethod)}</dd></div>
                <div><dt>Комментарий</dt><dd>{selectedOrder.customerComment || "—"}</dd></div>
              </dl>

              <div className={styles.items}>
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className={styles.itemRow}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.productSlug} · размер {item.size}</span>
                    </div>
                    <div>
                      <span>{item.quantity} × {formatMoney(item.unitPrice)}</span>
                      <strong>{formatMoney(item.lineTotal)}</strong>
                    </div>
                  </div>
                ))}
              </div>

              <dl className={styles.totals}>
                <div><dt>Товары</dt><dd>{formatMoney(selectedOrder.subtotal)}</dd></div>
                <div><dt>Доставка</dt><dd>{formatMoney(selectedOrder.deliveryCost)}</dd></div>
                <div><dt>Итого</dt><dd>{formatMoney(selectedOrder.total)}</dd></div>
              </dl>
            </article>
          )}
        </AdminPanel>
      </div>
    </div>
  );
}
