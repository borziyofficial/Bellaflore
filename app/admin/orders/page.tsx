"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
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
      <main style={styles.page}>
        <section style={styles.authPanel}>
          <p style={styles.eyebrow}>BellaFlore</p>
          <h1 style={styles.authTitle}>Проверка доступа</h1>
          <p style={styles.authText}>Открываем панель заказов.</p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <p style={styles.eyebrow}>BellaFlore Admin</p>
          <h1 style={styles.title}>Заказы</h1>
        </div>
        <div style={styles.headerActions}>
          <Link href="/admin" style={styles.backLink}>
            Панель
          </Link>
          <button
            type="button"
            style={styles.refreshButton}
            onClick={() => void loadOrders()}
            disabled={loading}
          >
            Обновить
          </button>
        </div>
      </section>

      {errorMessage && <p style={styles.error}>{errorMessage}</p>}
      {loading && <p style={styles.muted}>Загрузка заказов...</p>}
      {!loading && newestOrders.length === 0 && (
        <p style={styles.muted}>Заказов пока нет.</p>
      )}

      {newestOrders.length > 0 && (
        <section style={styles.ordersPanel} aria-label="Список заказов">
          <div style={styles.tableHeader} aria-hidden="true">
            <span>Order ID</span>
            <span>Customer name</span>
            <span>Phone</span>
            <span>Total amount</span>
            <span>Payment status</span>
            <span>Order status</span>
            <span>Created date</span>
          </div>

          {newestOrders.map((order) => {
            const isUpdating = updatingOrderId === order.order_id;

            return (
              <article style={styles.orderRow} key={order.order_id}>
                <div style={styles.cell}>
                  <span style={styles.mobileLabel}>Order ID</span>
                  <strong style={styles.orderId}>{order.order_id}</strong>
                </div>
                <div style={styles.cell}>
                  <span style={styles.mobileLabel}>Customer name</span>
                  <span style={styles.value}>{order.customer_name}</span>
                </div>
                <div style={styles.cell}>
                  <span style={styles.mobileLabel}>Phone</span>
                  <span style={styles.value}>{order.customer_phone}</span>
                </div>
                <div style={styles.cell}>
                  <span style={styles.mobileLabel}>Total amount</span>
                  <span style={styles.value}>{formatPrice(order.total_price)}</span>
                </div>
                <div style={styles.cell}>
                  <span style={styles.mobileLabel}>Payment status</span>
                  <span style={styles.statusBadge}>
                    {paymentStatusLabels[order.payment_status]}
                  </span>
                </div>
                <div style={styles.cell}>
                  <label style={styles.statusLabel}>
                    <span style={styles.mobileLabel}>Order status</span>
                    <select
                      value={order.order_status}
                      onChange={(event) =>
                        void updateOrderStatus(
                          order.order_id,
                          event.target.value as OrderStatus,
                        )
                      }
                      disabled={isUpdating}
                      style={styles.statusSelect}
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
                <div style={styles.cell}>
                  <span style={styles.mobileLabel}>Created date</span>
                  <span style={styles.value}>{formatDate(order.created_at)}</span>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    background: "#f7f2ea",
    color: "#2f2a24",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    width: "min(1180px, 100%)",
    margin: "0 auto 22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  authPanel: {
    width: "min(520px, 100%)",
    margin: "0 auto",
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    padding: "22px",
    background: "#ffffff",
    boxShadow: "0 14px 38px rgba(47, 42, 36, 0.08)",
  },
  authTitle: {
    margin: "4px 0 0",
    color: "#2f2a24",
    fontSize: "clamp(28px, 6vw, 40px)",
    lineHeight: 1,
  },
  authText: {
    margin: "12px 0 0",
    color: "#75695c",
    fontSize: "16px",
    lineHeight: 1.45,
  },
  eyebrow: {
    margin: 0,
    color: "#8a6b3d",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    margin: "4px 0 0",
    fontSize: "clamp(32px, 7vw, 48px)",
    lineHeight: 1,
  },
  backLink: {
    minHeight: "44px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(138, 107, 61, 0.28)",
    borderRadius: "8px",
    padding: "0 16px",
    background: "#fffaf2",
    color: "#2f2a24",
    textDecoration: "none",
    fontSize: "15px",
    fontWeight: 800,
  },
  refreshButton: {
    minHeight: "44px",
    border: "1px solid rgba(138, 107, 61, 0.32)",
    borderRadius: "8px",
    padding: "0 16px",
    background: "#2f2a24",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
  },
  error: {
    width: "min(1180px, 100%)",
    margin: "0 auto 16px",
    border: "1px solid rgba(176, 42, 42, 0.28)",
    borderRadius: "8px",
    padding: "12px 14px",
    background: "#fff1f1",
    color: "#8e2020",
  },
  muted: {
    width: "min(1180px, 100%)",
    margin: "0 auto 16px",
    color: "#75695c",
  },
  ordersPanel: {
    width: "min(1180px, 100%)",
    margin: "0 auto",
    display: "grid",
    gap: "10px",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(136px, 1fr))",
    gap: "10px",
    padding: "0 14px",
    color: "#8a6b3d",
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "uppercase",
  },
  orderRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(136px, 1fr))",
    gap: "10px",
    alignItems: "center",
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    padding: "14px",
    background: "#ffffff",
    boxShadow: "0 10px 30px rgba(47, 42, 36, 0.07)",
  },
  cell: {
    minWidth: 0,
  },
  mobileLabel: {
    display: "block",
    marginBottom: "4px",
    color: "#8a6b3d",
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "uppercase",
  },
  orderId: {
    display: "block",
    color: "#2f2a24",
    fontSize: "15px",
    lineHeight: 1.35,
    overflowWrap: "anywhere",
  },
  value: {
    display: "block",
    color: "#2f2a24",
    fontSize: "15px",
    lineHeight: 1.35,
    overflowWrap: "anywhere",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "30px",
    borderRadius: "999px",
    padding: "0 10px",
    background: "#fffaf2",
    color: "#51463a",
    fontSize: "13px",
    fontWeight: 800,
  },
  statusLabel: {
    display: "grid",
    gap: "4px",
  },
  statusSelect: {
    width: "100%",
    minWidth: 0,
    minHeight: "40px",
    border: "1px solid rgba(138, 107, 61, 0.28)",
    borderRadius: "8px",
    padding: "0 10px",
    background: "#fffaf2",
    color: "#2f2a24",
    font: "inherit",
    fontSize: "14px",
    fontWeight: 800,
  },
};
