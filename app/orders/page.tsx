// ==================================================
// SECTION: My Order — Orders List Page
// РАЗДЕЛ: Мой заказ — страница списка заказов
//
// Purpose (EN): Client page that fetches and displays all backend orders with links to order details.
//
// Назначение (RU): Клиентская страница загрузки и отображения всех backend-заказов со ссылками на детали.
// ==================================================

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  type BackendOrder,
  formatDate,
  formatPrice,
  getOrdersUrl,
  orderStatusLabels,
  paymentStatusLabels,
  sortNewestFirst,
} from "./orderUtils";

export default function OrdersPage() {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const newestOrders = useMemo(() => sortNewestFirst(orders), [orders]);

  useEffect(() => {
    let ignore = false;

    const loadOrders = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(getOrdersUrl(), { cache: "no-store" });

        if (!response.ok) {
          throw new Error(`Orders request failed: ${response.status}`);
        }

        const loadedOrders = (await response.json()) as BackendOrder[];

        if (!ignore) {
          setOrders(sortNewestFirst(loadedOrders));
        }
      } catch {
        if (!ignore) {
          setErrorMessage("Не удалось загрузить заказы из backend API.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadOrders();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <p style={styles.eyebrow}>BellaFlore</p>
        <h1 style={styles.title}>Заказы</h1>
      </section>

      {errorMessage && <p style={styles.error}>{errorMessage}</p>}
      {loading && <p style={styles.muted}>Загрузка заказов...</p>}
      {!loading && newestOrders.length === 0 && (
        <p style={styles.muted}>Заказов пока нет.</p>
      )}

      <section style={styles.orderList} aria-label="Список заказов">
        {newestOrders.map((order) => (
          <Link
            href={`/orders/${encodeURIComponent(order.order_id)}`}
            key={order.order_id}
            style={styles.orderLink}
            aria-label={`Открыть заказ ${order.order_id}`}
          >
            <article style={styles.orderCard}>
              <div style={styles.orderCardHeader}>
                <div>
                  <span style={styles.label}>Номер заказа</span>
                  <h2 style={styles.orderNumber}>{order.order_id}</h2>
                </div>
                <span style={styles.createdDate}>
                  {formatDate(order.created_at)}
                </span>
              </div>

              <dl style={styles.detailsGrid}>
                <div style={styles.detailItem}>
                  <dt style={styles.label}>Клиент</dt>
                  <dd style={styles.value}>{order.customer_name}</dd>
                </div>
                <div style={styles.detailItem}>
                  <dt style={styles.label}>Телефон</dt>
                  <dd style={styles.value}>{order.customer_phone}</dd>
                </div>
                <div style={styles.detailItem}>
                  <dt style={styles.label}>Сумма</dt>
                  <dd style={styles.value}>{formatPrice(order.total_price)}</dd>
                </div>
                <div style={styles.detailItem}>
                  <dt style={styles.label}>Способ оплаты</dt>
                  <dd style={styles.value}>{order.payment_method}</dd>
                </div>
                <div style={styles.detailItem}>
                  <dt style={styles.label}>Статус заказа</dt>
                  <dd style={styles.value}>
                    {orderStatusLabels[order.order_status]}
                  </dd>
                </div>
                <div style={styles.detailItem}>
                  <dt style={styles.label}>Статус оплаты</dt>
                  <dd style={styles.value}>
                    {paymentStatusLabels[order.payment_status]}
                  </dd>
                </div>
                <div style={styles.detailItem}>
                  <dt style={styles.label}>Дата создания</dt>
                  <dd style={styles.value}>{formatDate(order.created_at)}</dd>
                </div>
              </dl>
            </article>
          </Link>
        ))}
      </section>
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
    fontSize: "clamp(32px, 6vw, 52px)",
    lineHeight: 1,
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
  orderList: {
    width: "min(1180px, 100%)",
    margin: "0 auto",
    display: "grid",
    gap: "14px",
  },
  orderLink: {
    color: "inherit",
    textDecoration: "none",
    WebkitTapHighlightColor: "rgba(138, 107, 61, 0.16)",
  },
  orderCard: {
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    padding: "18px",
    background: "#ffffff",
    boxShadow: "0 12px 34px rgba(47, 42, 36, 0.08)",
  },
  orderCardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  orderNumber: {
    margin: "2px 0 0",
    fontSize: "24px",
    lineHeight: 1.1,
  },
  createdDate: {
    color: "#75695c",
    fontSize: "14px",
    textAlign: "right",
  },
  detailsGrid: {
    margin: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
  },
  detailItem: {
    minWidth: 0,
  },
  label: {
    display: "block",
    marginBottom: "4px",
    color: "#8a6b3d",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  value: {
    margin: 0,
    color: "#2f2a24",
    overflowWrap: "anywhere",
    fontSize: "16px",
    lineHeight: 1.35,
  },
};
