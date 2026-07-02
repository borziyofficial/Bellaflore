// ==================================================
// SECTION: Admin — CRM Client Detail (clients route)
// РАЗДЕЛ: Admin — детали CRM-клиента (маршрут clients)
//
// Purpose (EN): Protected admin CRM client detail under /admin/crm/clients/[phone] with order history.
//
// Назначение (RU): Защищённая деталь CRM-клиента admin по /admin/crm/clients/[phone] с историей заказов.
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
  paymentStatusLabels,
  orderStatusLabels,
  sortNewestFirst,
} from "../../../../orders/orderUtils";
import { ADMIN_LOGIN_PATH, hasAdminSession } from "../../../auth";

type ClientProfile = {
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  firstOrderDate: string;
  lastOrderDate: string;
  orders: BackendOrder[];
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

function getOrderTime(order: BackendOrder): number {
  const time = new Date(order.created_at).getTime();
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

function buildClientProfile(
  orders: BackendOrder[],
  phoneParam: string,
): ClientProfile | null {
  const normalizedParam = normalizePhone(decodeURIComponent(phoneParam));
  const clientOrders = sortNewestFirst(
    orders.filter(
      (order) => normalizePhone(order.customer_phone) === normalizedParam,
    ),
  );

  if (clientOrders.length === 0) {
    return null;
  }

  const totalSpent = clientOrders.reduce(
    (total, order) => total + order.total_price,
    0,
  );
  const oldestOrder = [...clientOrders].sort(
    (firstOrder, secondOrder) => getOrderTime(firstOrder) - getOrderTime(secondOrder),
  )[0];
  const newestOrder = clientOrders[0];

  return {
    name: newestOrder.customer_name,
    phone: newestOrder.customer_phone,
    totalOrders: clientOrders.length,
    totalSpent,
    averageOrderValue: Math.round(totalSpent / clientOrders.length),
    firstOrderDate: oldestOrder.created_at,
    lastOrderDate: newestOrder.created_at,
    orders: clientOrders,
  };
}

export default function CrmClientDetailsPage() {
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
          setErrorMessage("Не удалось загрузить профиль клиента.");
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

  const client = useMemo(
    () => buildClientProfile(orders, phoneParam),
    [orders, phoneParam],
  );

  if (!authChecked || !isAuthenticated) {
    return (
      <main style={styles.page}>
        <section style={styles.authPanel}>
          <p style={styles.eyebrow}>BellaFlore</p>
          <h1 style={styles.authTitle}>Проверка доступа</h1>
          <p style={styles.authText}>Открываем профиль клиента.</p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <Link href="/admin/crm/clients" style={styles.backLink}>
            CRM Clients
          </Link>
          <p style={styles.eyebrow}>BellaFlore CRM</p>
          <h1 style={styles.title}>Client Details</h1>
        </div>
        <span style={styles.modeBadge}>Read-only</span>
      </section>

      {errorMessage && <p style={styles.error}>{errorMessage}</p>}
      {loading && <p style={styles.muted}>Загрузка профиля клиента...</p>}
      {!loading && !client && !errorMessage && (
        <p style={styles.muted}>Клиент не найден.</p>
      )}

      {client && (
        <>
          <section style={styles.profileCard}>
            <div style={styles.profileHeader}>
              <div>
                <span style={styles.label}>Customer name</span>
                <h2 style={styles.clientName}>{client.name}</h2>
                <p style={styles.phoneText}>{client.phone}</p>
              </div>
              <div style={styles.badgeRow}>
                {client.totalSpent >= 100000 && (
                  <span style={styles.vipBadge}>VIP</span>
                )}
                {client.totalOrders >= 2 && (
                  <span style={styles.returningBadge}>Returning Client</span>
                )}
              </div>
            </div>

            <dl style={styles.metricsGrid}>
              <div style={styles.metricItem}>
                <dt style={styles.label}>Phone</dt>
                <dd style={styles.value}>{client.phone}</dd>
              </div>
              <div style={styles.metricItem}>
                <dt style={styles.label}>Total orders</dt>
                <dd style={styles.value}>
                  {client.totalOrders.toLocaleString("ru-RU")}
                </dd>
              </div>
              <div style={styles.metricItem}>
                <dt style={styles.label}>Total spent</dt>
                <dd style={styles.value}>{formatPrice(client.totalSpent)}</dd>
              </div>
              <div style={styles.metricItem}>
                <dt style={styles.label}>Average order value</dt>
                <dd style={styles.value}>
                  {formatPrice(client.averageOrderValue)}
                </dd>
              </div>
              <div style={styles.metricItem}>
                <dt style={styles.label}>First order date</dt>
                <dd style={styles.value}>{formatDate(client.firstOrderDate)}</dd>
              </div>
              <div style={styles.metricItem}>
                <dt style={styles.label}>Last order date</dt>
                <dd style={styles.value}>{formatDate(client.lastOrderDate)}</dd>
              </div>
            </dl>
          </section>

          <section style={styles.ordersSection} aria-label="Client orders">
            <div style={styles.sectionHeader}>
              <p style={styles.eyebrow}>Orders</p>
              <h2 style={styles.sectionTitle}>Client order history</h2>
            </div>

            <div style={styles.orderList}>
              {client.orders.map((order) => (
                <Link
                  href={`/orders/${encodeURIComponent(order.order_id)}`}
                  style={styles.orderLink}
                  key={order.order_id}
                >
                  <article style={styles.orderCard}>
                    <div style={styles.orderHeader}>
                      <div>
                        <span style={styles.label}>Order ID</span>
                        <h3 style={styles.orderId}>{order.order_id}</h3>
                      </div>
                      <span style={styles.orderTotal}>
                        {formatPrice(order.total_price)}
                      </span>
                    </div>

                    <dl style={styles.orderDetailsGrid}>
                      <div style={styles.metricItem}>
                        <dt style={styles.label}>Created</dt>
                        <dd style={styles.value}>{formatDate(order.created_at)}</dd>
                      </div>
                      <div style={styles.metricItem}>
                        <dt style={styles.label}>Payment</dt>
                        <dd style={styles.value}>
                          {paymentStatusLabels[order.payment_status]}
                        </dd>
                      </div>
                      <div style={styles.metricItem}>
                        <dt style={styles.label}>Status</dt>
                        <dd style={styles.value}>
                          {orderStatusLabels[order.order_status]}
                        </dd>
                      </div>
                    </dl>
                  </article>
                </Link>
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
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "38px",
    marginBottom: "14px",
    border: "1px solid rgba(138, 107, 61, 0.24)",
    borderRadius: "8px",
    padding: "0 13px",
    background: "#fffaf2",
    color: "#6f5128",
    fontSize: "14px",
    fontWeight: 850,
    textDecoration: "none",
    WebkitTapHighlightColor: "rgba(138, 107, 61, 0.16)",
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
  modeBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "36px",
    border: "1px solid rgba(138, 107, 61, 0.28)",
    borderRadius: "999px",
    padding: "0 14px",
    background: "#fffaf2",
    color: "#6f5128",
    fontSize: "13px",
    fontWeight: 900,
    textTransform: "uppercase",
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
    margin: "0 auto",
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    padding: "20px",
    background: "#ffffff",
    boxShadow: "0 12px 34px rgba(47, 42, 36, 0.08)",
  },
  profileHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "14px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  clientName: {
    margin: "2px 0 0",
    color: "#2f2a24",
    fontSize: "clamp(28px, 7vw, 42px)",
    lineHeight: 1,
    overflowWrap: "anywhere",
  },
  phoneText: {
    margin: "8px 0 0",
    color: "#75695c",
    fontSize: "16px",
    lineHeight: 1.35,
    overflowWrap: "anywhere",
  },
  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  vipBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "34px",
    border: "1px solid rgba(138, 107, 61, 0.28)",
    borderRadius: "999px",
    padding: "0 12px",
    background: "#2f2a24",
    color: "#fffaf2",
    fontSize: "13px",
    fontWeight: 900,
    textTransform: "uppercase",
  },
  returningBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "34px",
    border: "1px solid rgba(35, 106, 50, 0.26)",
    borderRadius: "999px",
    padding: "0 12px",
    background: "#e9f7ea",
    color: "#236a32",
    fontSize: "13px",
    fontWeight: 900,
  },
  metricsGrid: {
    margin: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "12px",
  },
  metricItem: {
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
  ordersSection: {
    width: "min(1180px, 100%)",
    margin: "18px auto 0",
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    padding: "18px",
    background: "#fffaf2",
    boxShadow: "0 12px 34px rgba(47, 42, 36, 0.06)",
  },
  sectionHeader: {
    marginBottom: "14px",
  },
  sectionTitle: {
    margin: "4px 0 0",
    color: "#2f2a24",
    fontSize: "24px",
    lineHeight: 1.15,
  },
  orderList: {
    display: "grid",
    gap: "12px",
  },
  orderLink: {
    color: "inherit",
    textDecoration: "none",
    WebkitTapHighlightColor: "rgba(138, 107, 61, 0.16)",
  },
  orderCard: {
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    padding: "14px",
    background: "#ffffff",
    boxShadow: "0 8px 22px rgba(47, 42, 36, 0.05)",
  },
  orderHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  orderId: {
    margin: "2px 0 0",
    color: "#2f2a24",
    fontSize: "20px",
    lineHeight: 1.1,
    overflowWrap: "anywhere",
  },
  orderTotal: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "32px",
    border: "1px solid rgba(138, 107, 61, 0.22)",
    borderRadius: "999px",
    padding: "0 11px",
    background: "#fffaf2",
    color: "#6f5128",
    fontSize: "14px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  orderDetailsGrid: {
    margin: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "10px",
  },
};
