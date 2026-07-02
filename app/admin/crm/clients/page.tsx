// ==================================================
// SECTION: Admin — CRM Clients List
// РАЗДЕЛ: Admin — список CRM-клиентов
//
// Purpose (EN): Protected admin CRM clients index — searchable list of customer profiles from backend orders.
//
// Назначение (RU): Защищённый индекс CRM-клиентов admin — поисковый список профилей из backend-заказов.
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
} from "../../../orders/orderUtils";
import { ADMIN_LOGIN_PATH, hasAdminSession } from "../../auth";

type ClientSummary = {
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
};

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function buildClientSummaries(orders: BackendOrder[]): ClientSummary[] {
  const clientsByPhone = new Map<string, ClientSummary>();

  orders.forEach((order) => {
    const phoneKey = normalizePhone(order.customer_phone) || order.customer_phone;
    const existingClient = clientsByPhone.get(phoneKey);
    const currentOrderTime = new Date(order.created_at).getTime();
    const existingOrderTime = existingClient
      ? new Date(existingClient.lastOrderDate).getTime()
      : Number.NEGATIVE_INFINITY;

    if (!existingClient) {
      clientsByPhone.set(phoneKey, {
        name: order.customer_name,
        phone: order.customer_phone,
        totalOrders: 1,
        totalSpent: order.total_price,
        lastOrderDate: order.created_at,
      });
      return;
    }

    existingClient.totalOrders += 1;
    existingClient.totalSpent += order.total_price;

    if (
      Number.isNaN(existingOrderTime) ||
      (!Number.isNaN(currentOrderTime) && currentOrderTime > existingOrderTime)
    ) {
      existingClient.name = order.customer_name;
      existingClient.phone = order.customer_phone;
      existingClient.lastOrderDate = order.created_at;
    }
  });

  return Array.from(clientsByPhone.values()).sort(
    (firstClient, secondClient) =>
      secondClient.totalSpent - firstClient.totalSpent ||
      secondClient.totalOrders - firstClient.totalOrders,
  );
}

function filterClients(
  clients: ClientSummary[],
  searchQuery: string,
): ClientSummary[] {
  const normalizedQuery = normalizeSearch(searchQuery);
  const normalizedPhoneQuery = normalizePhone(searchQuery);

  if (!normalizedQuery) {
    return clients;
  }

  return clients.filter((client) => {
    const clientName = client.name.toLowerCase();
    const clientPhone = normalizePhone(client.phone);

    return (
      clientName.includes(normalizedQuery) ||
      Boolean(
        normalizedPhoneQuery && clientPhone.includes(normalizedPhoneQuery),
      )
    );
  });
}

export default function CrmClientsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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
          setErrorMessage("Не удалось загрузить клиентов из backend API.");
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

  const clients = useMemo(() => buildClientSummaries(orders), [orders]);
  const visibleClients = useMemo(
    () => filterClients(clients, searchQuery),
    [clients, searchQuery],
  );

  if (!authChecked || !isAuthenticated) {
    return (
      <main style={styles.page}>
        <section style={styles.authPanel}>
          <p style={styles.eyebrow}>BellaFlore</p>
          <h1 style={styles.authTitle}>Проверка доступа</h1>
          <p style={styles.authText}>Открываем CRM клиентов.</p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <Link href="/admin" style={styles.backLink}>
            Admin Dashboard
          </Link>
          <p style={styles.eyebrow}>BellaFlore CRM</p>
          <h1 style={styles.title}>Clients</h1>
        </div>
        <span style={styles.modeBadge}>Read-only</span>
      </section>

      {errorMessage && <p style={styles.error}>{errorMessage}</p>}
      {loading && <p style={styles.muted}>Загрузка клиентов...</p>}

      <section style={styles.controls} aria-label="Поиск клиентов">
        <label style={styles.searchLabel}>
          <span style={styles.label}>Search clients</span>
          <input
            type="search"
            inputMode="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Имя или телефон"
            aria-label="Поиск по имени клиента или телефону"
            style={styles.searchInput}
          />
        </label>
      </section>

      {!loading && clients.length === 0 && (
        <p style={styles.muted}>Клиентов пока нет.</p>
      )}
      {!loading && clients.length > 0 && visibleClients.length === 0 && (
        <p style={styles.muted}>Клиенты не найдены.</p>
      )}

      <section style={styles.clientList} aria-label="Список клиентов CRM">
        {visibleClients.map((client) => (
          <article style={styles.clientCard} key={normalizePhone(client.phone)}>
            <div style={styles.clientHeader}>
              <div>
                <span style={styles.label}>Customer name</span>
                <h2 style={styles.clientName}>
                  <Link
                    href={`/admin/crm/clients/${encodeURIComponent(
                      normalizePhone(client.phone) || client.phone,
                    )}`}
                    style={styles.clientNameLink}
                  >
                    {client.name}
                  </Link>
                </h2>
              </div>
              <span style={styles.spendBadge}>{formatPrice(client.totalSpent)}</span>
            </div>

            <dl style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <dt style={styles.label}>Phone</dt>
                <dd style={styles.value}>{client.phone}</dd>
              </div>
              <div style={styles.detailItem}>
                <dt style={styles.label}>Total orders</dt>
                <dd style={styles.value}>
                  {client.totalOrders.toLocaleString("ru-RU")}
                </dd>
              </div>
              <div style={styles.detailItem}>
                <dt style={styles.label}>Total spent</dt>
                <dd style={styles.value}>{formatPrice(client.totalSpent)}</dd>
              </div>
              <div style={styles.detailItem}>
                <dt style={styles.label}>Last order date</dt>
                <dd style={styles.value}>{formatDate(client.lastOrderDate)}</dd>
              </div>
            </dl>
          </article>
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
  controls: {
    width: "min(1180px, 100%)",
    margin: "0 auto 18px",
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    padding: "16px",
    background: "#ffffff",
    boxShadow: "0 10px 30px rgba(47, 42, 36, 0.05)",
  },
  searchLabel: {
    display: "grid",
    gap: "8px",
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
  searchInput: {
    width: "100%",
    minHeight: "46px",
    border: "1px solid rgba(138, 107, 61, 0.28)",
    borderRadius: "8px",
    padding: "0 14px",
    background: "#fffaf2",
    color: "#2f2a24",
    font: "inherit",
    fontSize: "16px",
    outline: "none",
  },
  clientList: {
    width: "min(1180px, 100%)",
    margin: "0 auto",
    display: "grid",
    gap: "14px",
  },
  clientCard: {
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    padding: "18px",
    background: "#ffffff",
    boxShadow: "0 12px 34px rgba(47, 42, 36, 0.08)",
  },
  clientHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  clientName: {
    margin: "2px 0 0",
    color: "#2f2a24",
    fontSize: "24px",
    lineHeight: 1.1,
    overflowWrap: "anywhere",
  },
  clientNameLink: {
    color: "inherit",
    textDecoration: "none",
    WebkitTapHighlightColor: "rgba(138, 107, 61, 0.16)",
  },
  spendBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "34px",
    border: "1px solid rgba(138, 107, 61, 0.22)",
    borderRadius: "999px",
    padding: "0 12px",
    background: "#fffaf2",
    color: "#6f5128",
    fontSize: "14px",
    fontWeight: 900,
    whiteSpace: "nowrap",
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
  value: {
    margin: 0,
    color: "#2f2a24",
    overflowWrap: "anywhere",
    fontSize: "16px",
    lineHeight: 1.35,
  },
};
