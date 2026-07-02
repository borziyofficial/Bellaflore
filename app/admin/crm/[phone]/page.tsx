// ==================================================
// SECTION: Admin — CRM Customer Detail (by phone)
// РАЗДЕЛ: Admin — детали CRM-клиента (по телефону)
//
// Purpose (EN): Protected admin CRM detail page for a single customer identified by phone route param.
//
// Назначение (RU): Защищённая страница CRM admin с деталями одного клиента по phone-параметру маршрута.
// ==================================================

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
} from "../../../orders/orderUtils";
import { ADMIN_LOGIN_PATH, hasAdminSession } from "../../auth";

const VIP_SPEND_THRESHOLD_RUB = 50000;

type CustomerDetail = {
  name: string;
  phone: string;
  orders: BackendOrder[];
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string;
};

function getPhoneParam(phone: string | string[] | undefined): string {
  if (Array.isArray(phone)) {
    return phone[0] ?? "";
  }

  return phone ?? "";
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

function buildCustomerDetail(
  orders: BackendOrder[],
  phoneParam: string,
): CustomerDetail | null {
  const decodedPhone = decodeURIComponent(phoneParam);
  const normalizedParam = normalizePhone(decodedPhone);
  const customerOrders = sortNewestFirst(
    orders.filter((order) => {
      const orderPhone = normalizePhone(order.customer_phone);
      return normalizedParam
        ? orderPhone === normalizedParam
        : order.customer_phone === decodedPhone;
    }),
  );

  if (customerOrders.length === 0) {
    return null;
  }

  const totalSpent = customerOrders.reduce(
    (total, order) => total + order.total_price,
    0,
  );
  const latestOrder = customerOrders[0];

  return {
    name: latestOrder.customer_name,
    phone: latestOrder.customer_phone,
    orders: customerOrders,
    totalOrders: customerOrders.length,
    totalSpent,
    averageOrderValue: Math.round(totalSpent / customerOrders.length),
    lastOrderDate: latestOrder.created_at,
  };
}

export default function AdminCrmCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const phoneParam = useMemo(
    () => getPhoneParam(params.phone),
    [params.phone],
  );
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

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

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

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
          setOrders(loadedOrders);
        }
      } catch {
        if (!ignore) {
          setErrorMessage("Не удалось загрузить карточку клиента.");
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
  }, [isAuthenticated]);

  const customer = useMemo(
    () => buildCustomerDetail(orders, phoneParam),
    [orders, phoneParam],
  );

  const copyPhone = async () => {
    if (!customer) {
      return;
    }

    try {
      await navigator.clipboard.writeText(customer.phone);
      setCopyMessage("Телефон скопирован");
    } catch {
      setCopyMessage("Не удалось скопировать телефон");
    }
  };

  if (!authChecked || !isAuthenticated) {
    return (
      <main style={styles.page}>
        <section style={styles.authPanel}>
          <p style={styles.eyebrow}>BellaFlore</p>
          <h1 style={styles.authTitle}>Проверка доступа</h1>
          <p style={styles.authText}>Открываем карточку клиента.</p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <p style={styles.eyebrow}>BellaFlore CRM</p>
          <h1 style={styles.title}>Карточка клиента</h1>
        </div>
        <div style={styles.headerActions}>
          <Link href="/admin/crm" style={styles.backLink}>
            CRM
          </Link>
          <Link href="/admin/orders" style={styles.backLink}>
            Заказы
          </Link>
          <span style={styles.modeBadge}>Только просмотр</span>
        </div>
      </section>

      {errorMessage && <p style={styles.error}>{errorMessage}</p>}
      {loading && <p style={styles.muted}>Загрузка клиента...</p>}
      {!loading && !customer && !errorMessage && (
        <p style={styles.muted}>Клиент не найден.</p>
      )}

      {customer && (
        <>
          <section style={styles.profileCard}>
            <div style={styles.profileHeader}>
              <div>
                <span style={styles.label}>Customer name</span>
                <h2 style={styles.customerName}>{customer.name}</h2>
                <p style={styles.phoneText}>{customer.phone}</p>
              </div>
              <div style={styles.badgeRow}>
                {customer.totalOrders > 1 && (
                  <span style={styles.returningBadge}>Returning client</span>
                )}
                {customer.totalSpent >= VIP_SPEND_THRESHOLD_RUB && (
                  <span style={styles.vipBadge}>VIP</span>
                )}
              </div>
            </div>

            <div style={styles.quickActions}>
              <a href={`tel:${customer.phone}`} style={styles.actionLink}>
                Позвонить
              </a>
              <button type="button" style={styles.actionButton} onClick={copyPhone}>
                Скопировать телефон
              </button>
              {copyMessage && <span style={styles.copyMessage}>{copyMessage}</span>}
            </div>

            <dl style={styles.metricsGrid}>
              <div style={styles.metricItem}>
                <dt style={styles.label}>Phone</dt>
                <dd style={styles.value}>{customer.phone}</dd>
              </div>
              <div style={styles.metricItem}>
                <dt style={styles.label}>Total orders</dt>
                <dd style={styles.value}>
                  {customer.totalOrders.toLocaleString("ru-RU")}
                </dd>
              </div>
              <div style={styles.metricItem}>
                <dt style={styles.label}>Total spent</dt>
                <dd style={styles.value}>{formatPrice(customer.totalSpent)}</dd>
              </div>
              <div style={styles.metricItem}>
                <dt style={styles.label}>Average order value</dt>
                <dd style={styles.value}>
                  {formatPrice(customer.averageOrderValue)}
                </dd>
              </div>
              <div style={styles.metricItem}>
                <dt style={styles.label}>Last order date</dt>
                <dd style={styles.value}>{formatDate(customer.lastOrderDate)}</dd>
              </div>
            </dl>
          </section>

          <section style={styles.ordersPanel} aria-label="Заказы клиента">
            <div style={styles.panelHeader}>
              <p style={styles.eyebrow}>Orders</p>
              <h2 style={styles.panelTitle}>Все заказы клиента</h2>
            </div>

            <div style={styles.orderList}>
              {customer.orders.map((order) => (
                <article style={styles.orderCard} key={order.order_id}>
                  <div style={styles.orderHeader}>
                    <div>
                      <span style={styles.label}>Order ID</span>
                      <h3 style={styles.orderId}>{order.order_id}</h3>
                    </div>
                    <span style={styles.orderTotal}>
                      {formatPrice(order.total_price)}
                    </span>
                  </div>

                  <dl style={styles.orderDetails}>
                    <div>
                      <dt style={styles.label}>Date</dt>
                      <dd style={styles.value}>{formatDate(order.created_at)}</dd>
                    </div>
                    <div>
                      <dt style={styles.label}>Total amount</dt>
                      <dd style={styles.value}>{formatPrice(order.total_price)}</dd>
                    </div>
                    <div>
                      <dt style={styles.label}>Payment status</dt>
                      <dd style={styles.value}>
                        {paymentStatusLabels[order.payment_status]}
                      </dd>
                    </div>
                    <div>
                      <dt style={styles.label}>Order status</dt>
                      <dd style={styles.value}>
                        {orderStatusLabels[order.order_status]}
                      </dd>
                    </div>
                  </dl>

                  <div style={styles.orderActions}>
                    <Link
                      href={`/orders/${encodeURIComponent(order.order_id)}`}
                      style={styles.orderLink}
                    >
                      Открыть заказ
                    </Link>
                    <Link href="/admin/orders" style={styles.orderLink}>
                      В панели заказов
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
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
    alignItems: "flex-end",
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
    fontSize: "clamp(34px, 7vw, 58px)",
    lineHeight: 1,
  },
  backLink: {
    minHeight: "40px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(138, 107, 61, 0.26)",
    borderRadius: "8px",
    padding: "0 13px",
    background: "#fffaf2",
    color: "#6f5128",
    fontSize: "14px",
    fontWeight: 850,
    textDecoration: "none",
  },
  modeBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "40px",
    border: "1px solid rgba(138, 107, 61, 0.28)",
    borderRadius: "999px",
    padding: "0 14px",
    background: "#fffaf2",
    color: "#6f5128",
    fontSize: "13px",
    fontWeight: 900,
    textTransform: "uppercase",
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
  profileCard: {
    width: "min(1180px, 100%)",
    margin: "0 auto 16px",
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    padding: "18px",
    background: "#ffffff",
    boxShadow: "0 12px 34px rgba(47, 42, 36, 0.08)",
  },
  profileHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "16px",
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
  customerName: {
    margin: "2px 0 0",
    color: "#2f2a24",
    fontSize: "clamp(28px, 6vw, 42px)",
    lineHeight: 1,
    overflowWrap: "anywhere",
  },
  phoneText: {
    margin: "8px 0 0",
    color: "#75695c",
    fontSize: "16px",
    lineHeight: 1.4,
    overflowWrap: "anywhere",
  },
  badgeRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  returningBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "34px",
    border: "1px solid rgba(35, 106, 50, 0.28)",
    borderRadius: "999px",
    padding: "0 12px",
    background: "#e9f7ea",
    color: "#236a32",
    fontSize: "13px",
    fontWeight: 900,
    textTransform: "uppercase",
  },
  vipBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "34px",
    border: "1px solid rgba(138, 107, 61, 0.32)",
    borderRadius: "999px",
    padding: "0 12px",
    background: "#2f2a24",
    color: "#fffaf2",
    fontSize: "13px",
    fontWeight: 900,
    textTransform: "uppercase",
  },
  quickActions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "18px",
  },
  actionLink: {
    minHeight: "40px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(138, 107, 61, 0.28)",
    borderRadius: "8px",
    padding: "0 13px",
    background: "#2f2a24",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 850,
    textDecoration: "none",
  },
  actionButton: {
    minHeight: "40px",
    border: "1px solid rgba(138, 107, 61, 0.26)",
    borderRadius: "8px",
    padding: "0 13px",
    background: "#fffaf2",
    color: "#2f2a24",
    font: "inherit",
    fontSize: "14px",
    fontWeight: 850,
    cursor: "pointer",
  },
  copyMessage: {
    color: "#75695c",
    fontSize: "14px",
    fontWeight: 800,
  },
  metricsGrid: {
    margin: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "12px",
  },
  metricItem: {
    minWidth: 0,
    border: "1px solid rgba(138, 107, 61, 0.12)",
    borderRadius: "8px",
    padding: "12px",
    background: "#fffaf2",
  },
  value: {
    margin: 0,
    color: "#2f2a24",
    fontSize: "15px",
    lineHeight: 1.35,
    overflowWrap: "anywhere",
  },
  ordersPanel: {
    width: "min(1180px, 100%)",
    margin: "0 auto",
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    padding: "18px",
    background: "#ffffff",
    boxShadow: "0 12px 34px rgba(47, 42, 36, 0.08)",
  },
  panelHeader: {
    marginBottom: "14px",
  },
  panelTitle: {
    margin: "4px 0 0",
    color: "#2f2a24",
    fontSize: "24px",
    lineHeight: 1.1,
  },
  orderList: {
    display: "grid",
    gap: "12px",
  },
  orderCard: {
    border: "1px solid rgba(138, 107, 61, 0.14)",
    borderRadius: "8px",
    padding: "14px",
    background: "#fffaf2",
  },
  orderHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "12px",
  },
  orderId: {
    margin: "2px 0 0",
    color: "#2f2a24",
    fontSize: "19px",
    lineHeight: 1.15,
    overflowWrap: "anywhere",
  },
  orderTotal: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "32px",
    borderRadius: "999px",
    padding: "0 10px",
    background: "#ffffff",
    color: "#6f5128",
    fontSize: "14px",
    fontWeight: 900,
  },
  orderDetails: {
    margin: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "10px",
  },
  orderActions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "14px",
  },
  orderLink: {
    minHeight: "38px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(138, 107, 61, 0.22)",
    borderRadius: "8px",
    padding: "0 12px",
    background: "#ffffff",
    color: "#2f2a24",
    fontSize: "14px",
    fontWeight: 850,
    textDecoration: "none",
  },
};
