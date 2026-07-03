// ==================================================
// SECTION: Admin — Orders Management Page
// РАЗДЕЛ: Admin — страница управления заказами
// ==================================================

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminAppShell } from "@/components/adminEntry";
import { ADMIN_LOGIN_PATH, hasAdminSession } from "../auth";
import {
  type BackendOrder,
  type OrderStatus,
  formatDate,
  formatPrice,
  getOrdersUrl,
  orderStatusLabels,
  paymentStatusLabels,
  sortNewestFirst,
} from "../../orders/orderUtils";
import styles from "./AdminOrdersPage.module.css";

const orderStatusOptions: OrderStatus[] = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "COURIER_ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");

  const newestOrders = useMemo(() => sortNewestFirst(orders), [orders]);

  useEffect(() => {
    const authTimer = window.setTimeout(() => {
      if (hasAdminSession()) {
        setIsAuthenticated(true);
        setAuthChecked(true);
        return;
      }

      setAuthChecked(true);
      router.replace(ADMIN_LOGIN_PATH);
    }, 0);

    return () => window.clearTimeout(authTimer);
  }, [router]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(getOrdersUrl(), { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Orders request failed: ${response.status}`);
      }

      const loadedOrders = (await response.json()) as BackendOrder[];
      setOrders(sortNewestFirst(loadedOrders));
    } catch {
      setErrorMessage("Не удалось загрузить заказы из backend API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const loadTimer = window.setTimeout(() => {
      void loadOrders();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [isAuthenticated, loadOrders]);

  const updateOrderStatus = async (
    orderId: string,
    orderStatus: OrderStatus,
  ) => {
    setUpdatingOrderId(orderId);
    setErrorMessage("");

    try {
      const response = await fetch(`${getOrdersUrl()}/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order_status: orderStatus }),
      });

      if (!response.ok) {
        throw new Error(`Order status request failed: ${response.status}`);
      }

      const updatedOrder = (await response.json()) as BackendOrder;
      setOrders((currentOrders) =>
        sortNewestFirst(
          currentOrders.map((order) =>
            order.order_id === orderId ? updatedOrder : order,
          ),
        ),
      );
    } catch {
      setErrorMessage("Не удалось обновить статус заказа.");
    } finally {
      setUpdatingOrderId("");
    }
  };

  if (!authChecked || !isAuthenticated) {
    return (
      <main className={styles.page}>
        <section className={styles.authPanel}>
          <p className={styles.eyebrow}>BellaFlore</p>
          <h1 className={styles.authTitle}>Проверка доступа</h1>
          <p className={styles.authText}>Открываем панель заказов.</p>
        </section>
      </main>
    );
  }

  return (
    <AdminAppShell title="Заказы">
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>BellaFlore Admin</p>
            <h1 className={styles.title}>Заказы</h1>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.refreshButton}
              onClick={() => void loadOrders()}
              disabled={loading}
            >
              Обновить
            </button>
          </div>
        </header>

        {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
        {loading ? <p className={styles.muted}>Загрузка заказов...</p> : null}
        {!loading && newestOrders.length === 0 ? (
          <p className={styles.muted}>Заказов пока нет.</p>
        ) : null}

        {newestOrders.length > 0 ? (
          <section className={styles.ordersPanel} aria-label="Список заказов">
            <div className={styles.tableHeader} aria-hidden="true">
              <span>ID заказа</span>
              <span>Клиент</span>
              <span>Телефон</span>
              <span>Сумма</span>
              <span>Оплата</span>
              <span>Статус</span>
              <span>Дата</span>
            </div>

            {newestOrders.map((order) => {
              const isUpdating = updatingOrderId === order.order_id;

              return (
                <article className={styles.orderRow} key={order.order_id}>
                  <div className={styles.cell}>
                    <span className={styles.mobileLabel}>ID заказа</span>
                    <strong className={styles.orderId}>{order.order_id}</strong>
                  </div>
                  <div className={styles.cell}>
                    <span className={styles.mobileLabel}>Клиент</span>
                    <span className={styles.value}>{order.customer_name}</span>
                  </div>
                  <div className={styles.cell}>
                    <span className={styles.mobileLabel}>Телефон</span>
                    <span className={styles.value}>{order.customer_phone}</span>
                  </div>
                  <div className={styles.cell}>
                    <span className={styles.mobileLabel}>Сумма</span>
                    <span className={styles.value}>
                      {formatPrice(order.total_price)}
                    </span>
                  </div>
                  <div className={styles.cell}>
                    <span className={styles.mobileLabel}>Оплата</span>
                    <span className={styles.statusBadge}>
                      {paymentStatusLabels[order.payment_status]}
                    </span>
                  </div>
                  <div className={styles.cell}>
                    <label className={styles.statusLabel}>
                      <span className={styles.mobileLabel}>Статус</span>
                      <select
                        value={order.order_status}
                        onChange={(event) =>
                          void updateOrderStatus(
                            order.order_id,
                            event.target.value as OrderStatus,
                          )
                        }
                        disabled={isUpdating}
                        className={styles.statusSelect}
                        aria-label={`Статус заказа ${order.order_id}`}
                      >
                        {orderStatusOptions.map((status) => (
                          <option value={status} key={status}>
                            {orderStatusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className={styles.cell}>
                    <span className={styles.mobileLabel}>Дата</span>
                    <span className={styles.value}>
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                </article>
              );
            })}
          </section>
        ) : null}
      </div>
    </AdminAppShell>
  );
}
