// ==================================================
// SECTION: ADMIN APP — Orders module
// ==================================================
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  type AdminOrder,
  fetchAdminOrders,
  formatOrderDate,
  formatOrderPrice,
  orderStatusLabels,
} from "@/lib/orders/adminClient";
import type { OrderStatus } from "@/lib/orders/types";
import { AdminModuleHeader, AdminPanel, AdminStatCard } from "@/components/adminApp/shared/AdminModuleUi";
import ui from "@/components/adminApp/shared/AdminModuleUi.module.css";
import styles from "@/components/adminApp/modules/orders/AdminOrdersModule.module.css";

const ORDER_STATUSES: OrderStatus[] = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "COURIER_ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const STATUS_TABS = [
  { id: "ALL", label: "Все" },
  ...ORDER_STATUSES.map((status) => ({ id: status, label: orderStatusLabels[status] })),
] as const;

export function AdminOrdersModule() {
  const [activeStatus, setActiveStatus] = useState<"ALL" | OrderStatus>("ALL");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const filteredOrders = useMemo(
    () => activeStatus === "ALL" ? orders : orders.filter((order) => order.status === activeStatus),
    [activeStatus, orders],
  );

  async function loadOrders() {
    setLoading(true);
    setErrorMessage("");
    try {
      setOrders(await fetchAdminOrders());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Не удалось загрузить заказы.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadOrders(), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const newCount = orders.filter((order) => order.status === "NEW").length;
  const inProgressCount = orders.filter((order) =>
    ["CONFIRMED", "PREPARING", "COURIER_ASSIGNED", "OUT_FOR_DELIVERY"].includes(order.status),
  ).length;
  const revenue = orders.reduce(
    (sum, order) => order.status === "CANCELLED" ? sum : sum + order.total,
    0,
  );

  return (
    <div className={ui.stack}>
      <AdminModuleHeader
        title="Заказы"
        subtitle="Реальные production orders из orders/order_items"
        action={<button className={ui.actionButton} type="button" onClick={loadOrders}>Обновить</button>}
      />

      <div className={ui.statGrid}>
        <AdminStatCard label="Всего" value={String(orders.length)} hint="Последние 100 заказов" />
        <AdminStatCard label="Новые" value={String(newCount)} hint="Ожидают обработки" />
        <AdminStatCard label="В работе" value={String(inProgressCount)} hint="Активная доставка" />
        <AdminStatCard label="Сумма" value={formatOrderPrice(revenue)} hint="Без отменённых" />
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

      <AdminPanel title={loading ? "Загружаем заказы…" : `Заказы (${filteredOrders.length})`}>
        {!loading && filteredOrders.length === 0 ? (
          <div className={ui.emptyZone}>Заказов в этом статусе пока нет.</div>
        ) : (
          <div className={styles.orderList} aria-busy={loading}>
            {filteredOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${encodeURIComponent(order.id)}`}
                className={styles.orderCard}
                aria-label={`Открыть заказ ${order.orderNumber}`}
              >
                <span className={styles.orderCardHeader}>
                  <strong>{order.orderNumber}</strong>
                  <span>{orderStatusLabels[order.status]}</span>
                </span>
                <span>{formatOrderDate(order.createdAt)}</span>
                <span>{order.customer.name} · {order.customer.phone}</span>
                <span>{order.delivery.date} · {order.delivery.interval}</span>
                <strong>{formatOrderPrice(order.total)}</strong>
              </Link>
            ))}
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
