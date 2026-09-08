// ==================================================
// SECTION: Admin — CRM Clients List
// РАЗДЕЛ: Admin — список CRM-клиентов
// ==================================================

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdminAppShell } from "@/components/adminEntry";
import {
  type AdminOrder,
  fetchAdminOrders,
  formatOrderDate as formatDate,
  formatOrderPrice as formatPrice,
} from "@/lib/orders/adminClient";
import { ADMIN_LOGIN_PATH, hasAdminSession } from "../../auth";
import styles from "./CrmClientsPage.module.css";

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

function buildClientSummaries(orders: AdminOrder[]): ClientSummary[] {
  const clientsByPhone = new Map<string, ClientSummary>();

  orders.forEach((order) => {
    const phoneKey = normalizePhone(order.customer.phone) || order.customer.phone;
    const existingClient = clientsByPhone.get(phoneKey);
    const currentOrderTime = new Date(order.createdAt).getTime();
    const existingOrderTime = existingClient
      ? new Date(existingClient.lastOrderDate).getTime()
      : Number.NEGATIVE_INFINITY;

    if (!existingClient) {
      clientsByPhone.set(phoneKey, {
        name: order.customer.name,
        phone: order.customer.phone,
        totalOrders: 1,
        totalSpent: order.total,
        lastOrderDate: order.createdAt,
      });
      return;
    }

    existingClient.totalOrders += 1;
    existingClient.totalSpent += order.total;

    if (
      Number.isNaN(existingOrderTime) ||
      (!Number.isNaN(currentOrderTime) && currentOrderTime > existingOrderTime)
    ) {
      existingClient.name = order.customer.name;
      existingClient.phone = order.customer.phone;
      existingClient.lastOrderDate = order.createdAt;
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
  const [orders, setOrders] = useState<AdminOrder[]>([]);
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
        const loadedOrders = await fetchAdminOrders();

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
      <main className={styles.page}>
        <section className={styles.authPanel}>
          <p className={styles.eyebrow}>BellaFlore</p>
          <h1 className={styles.authTitle}>Проверка доступа</h1>
          <p className={styles.authText}>Открываем CRM клиентов.</p>
        </section>
      </main>
    );
  }

  return (
    <AdminAppShell title="Клиенты">
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>BellaFlore CRM</p>
            <h1 className={styles.title}>Клиенты</h1>
          </div>
          <span className={styles.modeBadge}>Только чтение</span>
        </header>

        {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
        {loading ? <p className={styles.muted}>Загрузка клиентов...</p> : null}

        <section className={styles.controls} aria-label="Поиск клиентов">
          <label className={styles.searchLabel}>
            <span className={styles.label}>Поиск</span>
            <input
              type="search"
              inputMode="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Имя или телефон"
              aria-label="Поиск по имени клиента или телефону"
              className={styles.searchInput}
            />
          </label>
        </section>

        {!loading && clients.length === 0 ? (
          <p className={styles.muted}>Клиентов пока нет.</p>
        ) : null}
        {!loading && clients.length > 0 && visibleClients.length === 0 ? (
          <p className={styles.muted}>Клиенты не найдены.</p>
        ) : null}

        <section className={styles.clientList} aria-label="Список клиентов CRM">
          {visibleClients.map((client) => (
            <article className={styles.clientCard} key={normalizePhone(client.phone)}>
              <div className={styles.clientHeader}>
                <div>
                  <span className={styles.label}>Клиент</span>
                  <h2 className={styles.clientName}>
                    <Link
                      href={`/admin/crm/clients/${encodeURIComponent(
                        normalizePhone(client.phone) || client.phone,
                      )}`}
                      className={styles.clientNameLink}
                    >
                      {client.name}
                    </Link>
                  </h2>
                </div>
                <span className={styles.spendBadge}>
                  {formatPrice(client.totalSpent)}
                </span>
              </div>

              <dl className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <dt className={styles.label}>Телефон</dt>
                  <dd className={styles.value}>{client.phone}</dd>
                </div>
                <div className={styles.detailItem}>
                  <dt className={styles.label}>Заказов</dt>
                  <dd className={styles.value}>
                    {client.totalOrders.toLocaleString("ru-RU")}
                  </dd>
                </div>
                <div className={styles.detailItem}>
                  <dt className={styles.label}>Сумма покупок</dt>
                  <dd className={styles.value}>{formatPrice(client.totalSpent)}</dd>
                </div>
                <div className={styles.detailItem}>
                  <dt className={styles.label}>Последний заказ</dt>
                  <dd className={styles.value}>{formatDate(client.lastOrderDate)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </section>
      </div>
    </AdminAppShell>
  );
}
