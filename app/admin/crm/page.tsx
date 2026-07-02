// ==================================================
// SECTION: Admin — CRM Customers Page
// РАЗДЕЛ: Admin — страница CRM-клиентов
//
// Purpose (EN): Protected admin CRM view — aggregates backend orders into customer profiles by phone number.
//
// Назначение (RU): Защищённый CRM admin — агрегирует backend-заказы в профили клиентов по номеру телефона.
// ==================================================

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "../../orders/orderUtils";
import { ADMIN_LOGIN_PATH, hasAdminSession } from "../auth";

type CustomerProfile = {
  phoneKey: string;
  name: string;
  phone: string;
  orders: BackendOrder[];
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  lastOrderStatus: BackendOrder["order_status"];
};

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

function getOrderTime(order: BackendOrder): number {
  const time = new Date(order.created_at).getTime();
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

function buildCustomerProfiles(orders: BackendOrder[]): CustomerProfile[] {
  const customersByPhone = new Map<string, BackendOrder[]>();

  orders.forEach((order) => {
    const phoneKey = normalizePhone(order.customer_phone) || order.customer_phone;
    const customerOrders = customersByPhone.get(phoneKey) ?? [];
    customerOrders.push(order);
    customersByPhone.set(phoneKey, customerOrders);
  });

  return Array.from(customersByPhone.entries())
    .map(([phoneKey, customerOrders]) => {
      const sortedOrders = sortNewestFirst(customerOrders);
      const lastOrder = sortedOrders[0];
      const totalSpent = sortedOrders.reduce(
        (total, order) => total + order.total_price,
        0,
      );

      return {
        phoneKey,
        name: lastOrder.customer_name,
        phone: lastOrder.customer_phone,
        orders: sortedOrders,
        totalOrders: sortedOrders.length,
        totalSpent,
        lastOrderDate: lastOrder.created_at,
        lastOrderStatus: lastOrder.order_status,
      };
    })
    .sort(
      (firstCustomer, secondCustomer) =>
        getOrderTime(secondCustomer.orders[0]) -
          getOrderTime(firstCustomer.orders[0]) ||
        secondCustomer.totalSpent - firstCustomer.totalSpent,
    );
}

export default function AdminCrmPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [selectedPhoneKey, setSelectedPhoneKey] = useState("");
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
          setErrorMessage("Не удалось загрузить CRM из backend API.");
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

  const customers = useMemo(() => buildCustomerProfiles(orders), [orders]);

  const selectedCustomer = useMemo(
    () =>
      customers.find((customer) => customer.phoneKey === selectedPhoneKey) ??
      customers[0] ??
      null,
    [customers, selectedPhoneKey],
  );

  if (!authChecked || !isAuthenticated) {
    return (
      <main style={styles.page}>
        <section style={styles.authPanel}>
          <p style={styles.eyebrow}>BellaFlore</p>
          <h1 style={styles.authTitle}>Проверка доступа</h1>
          <p style={styles.authText}>Открываем CRM.</p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <p style={styles.eyebrow}>BellaFlore CRM</p>
          <h1 style={styles.title}>Клиенты</h1>
        </div>
        <div style={styles.headerActions}>
          <Link href="/admin" style={styles.backLink}>
            Панель
          </Link>
          <Link href="/admin/orders" style={styles.backLink}>
            Заказы
          </Link>
          <span style={styles.modeBadge}>Только просмотр</span>
        </div>
      </section>

      {errorMessage && <p style={styles.error}>{errorMessage}</p>}
      {loading && <p style={styles.muted}>Загрузка CRM...</p>}
      {!loading && customers.length === 0 && (
        <p style={styles.muted}>Клиентов пока нет.</p>
      )}

      {customers.length > 0 && (
        <section style={styles.crmShell} aria-label="CRM клиенты">
          <div style={styles.customerListPanel}>
            <div style={styles.panelHeader}>
              <p style={styles.eyebrow}>Customers</p>
              <h2 style={styles.panelTitle}>Список клиентов</h2>
            </div>

            <div style={styles.customerList}>
              {customers.map((customer) => {
                const isSelected = customer.phoneKey === selectedCustomer?.phoneKey;

                return (
                  <div style={styles.customerListItem} key={customer.phoneKey}>
                    <button
                      type="button"
                      style={{
                        ...styles.customerButton,
                        ...(isSelected ? styles.customerButtonActive : null),
                      }}
                      onClick={() => setSelectedPhoneKey(customer.phoneKey)}
                      aria-pressed={isSelected}
                    >
                      <span style={styles.customerButtonName}>
                        {customer.name}
                      </span>
                      <span style={styles.customerButtonPhone}>
                        {customer.phone}
                      </span>
                      <span style={styles.customerButtonMeta}>
                        {customer.totalOrders.toLocaleString("ru-RU")} заказов ·{" "}
                        {formatPrice(customer.totalSpent)}
                      </span>
                    </button>
                    <Link
                      href={`/admin/crm/${encodeURIComponent(customer.phoneKey)}`}
                      style={styles.profileLink}
                    >
                      Открыть карточку
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedCustomer && (
            <div style={styles.detailPanel}>
              <section style={styles.profileCard}>
                <div style={styles.profileHeader}>
                  <div>
                    <span style={styles.label}>Customer name</span>
                    <h2 style={styles.customerName}>{selectedCustomer.name}</h2>
                    <p style={styles.phoneText}>{selectedCustomer.phone}</p>
                  </div>
                  <div style={styles.profileHeaderActions}>
                    {selectedCustomer.totalOrders > 1 && (
                      <span style={styles.returningBadge}>Returning client</span>
                    )}
                    <Link
                      href={`/admin/crm/${encodeURIComponent(
                        selectedCustomer.phoneKey,
                      )}`}
                      style={styles.orderLink}
                    >
                      Полная карточка
                    </Link>
                  </div>
                </div>

                <dl style={styles.metricsGrid}>
                  <div style={styles.metricItem}>
                    <dt style={styles.label}>Phone</dt>
                    <dd style={styles.value}>{selectedCustomer.phone}</dd>
                  </div>
                  <div style={styles.metricItem}>
                    <dt style={styles.label}>Total orders</dt>
                    <dd style={styles.value}>
                      {selectedCustomer.totalOrders.toLocaleString("ru-RU")}
                    </dd>
                  </div>
                  <div style={styles.metricItem}>
                    <dt style={styles.label}>Total spent</dt>
                    <dd style={styles.value}>
                      {formatPrice(selectedCustomer.totalSpent)}
                    </dd>
                  </div>
                  <div style={styles.metricItem}>
                    <dt style={styles.label}>Last order date</dt>
                    <dd style={styles.value}>
                      {formatDate(selectedCustomer.lastOrderDate)}
                    </dd>
                  </div>
                  <div style={styles.metricItem}>
                    <dt style={styles.label}>Last order status</dt>
                    <dd style={styles.value}>
                      {orderStatusLabels[selectedCustomer.lastOrderStatus]}
                    </dd>
                  </div>
                </dl>
              </section>

              <section style={styles.ordersPanel} aria-label="Заказы клиента">
                <div style={styles.panelHeader}>
                  <p style={styles.eyebrow}>Orders</p>
                  <h2 style={styles.panelTitle}>История заказов</h2>
                </div>

                <div style={styles.orderList}>
                  {selectedCustomer.orders.map((order) => (
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
                          <dt style={styles.label}>Created</dt>
                          <dd style={styles.value}>
                            {formatDate(order.created_at)}
                          </dd>
                        </div>
                        <div>
                          <dt style={styles.label}>Payment</dt>
                          <dd style={styles.value}>
                            {paymentStatusLabels[order.payment_status]}
                          </dd>
                        </div>
                        <div>
                          <dt style={styles.label}>Status</dt>
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
            </div>
          )}
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
  crmShell: {
    width: "min(1180px, 100%)",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "minmax(260px, 0.82fr) minmax(0, 1.18fr)",
    gap: "18px",
    alignItems: "start",
  },
  customerListPanel: {
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
  customerList: {
    display: "grid",
    gap: "10px",
  },
  customerListItem: {
    display: "grid",
    gap: "8px",
  },
  customerButton: {
    width: "100%",
    border: "1px solid rgba(138, 107, 61, 0.16)",
    borderRadius: "8px",
    padding: "14px",
    background: "#fffaf2",
    color: "#2f2a24",
    textAlign: "left",
    cursor: "pointer",
  },
  customerButtonActive: {
    borderColor: "rgba(138, 107, 61, 0.42)",
    background: "#2f2a24",
    color: "#ffffff",
  },
  customerButtonName: {
    display: "block",
    fontSize: "17px",
    fontWeight: 900,
    lineHeight: 1.2,
    overflowWrap: "anywhere",
  },
  customerButtonPhone: {
    display: "block",
    marginTop: "5px",
    fontSize: "14px",
    lineHeight: 1.35,
    opacity: 0.82,
    overflowWrap: "anywhere",
  },
  customerButtonMeta: {
    display: "block",
    marginTop: "8px",
    fontSize: "13px",
    fontWeight: 800,
    lineHeight: 1.35,
    opacity: 0.86,
  },
  profileLink: {
    minHeight: "36px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(138, 107, 61, 0.2)",
    borderRadius: "8px",
    padding: "0 12px",
    background: "#ffffff",
    color: "#2f2a24",
    fontSize: "13px",
    fontWeight: 850,
    textDecoration: "none",
  },
  detailPanel: {
    display: "grid",
    gap: "16px",
    minWidth: 0,
  },
  profileCard: {
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
  profileHeaderActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
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
    fontSize: "clamp(26px, 5vw, 36px)",
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
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    padding: "18px",
    background: "#ffffff",
    boxShadow: "0 12px 34px rgba(47, 42, 36, 0.08)",
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
