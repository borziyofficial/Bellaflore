"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  type BackendOrder,
  formatPrice,
  getOrdersUrl,
  sortNewestFirst,
} from "../orders/orderUtils";
import { ADMIN_LOGIN_PATH, hasAdminSession } from "./auth";

const quickLinks = [
  {
    href: "/admin/orders",
    label: "Заказы",
    description: "Все заказы и статусы",
  },
  {
    href: "/admin/crm/clients",
    label: "CRM Клиенты",
    description: "Клиентская база из заказов",
  },
  {
    href: "/admin/orders",
    label: "Ожидают оплаты",
    description: "Заказы без подтверждённой оплаты",
  },
  {
    href: "/admin/orders",
    label: "В доставке",
    description: "Заказы, которые уже у курьера",
  },
  {
    href: "/admin/orders",
    label: "Доставленные",
    description: "Завершённые доставки",
  },
];

function isSameCalendarDay(firstDateValue: string, secondDate: Date): boolean {
  const firstDate = new Date(firstDateValue);

  if (Number.isNaN(firstDate.getTime())) {
    return false;
  }

  return firstDate.toDateString() === secondDate.toDateString();
}

export default function AdminDashboardPage() {
  const router = useRouter();
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
  }, [isAuthenticated]);

  const summaryCards = useMemo(() => {
    const today = new Date();
    const totalOrders = orders.length;
    const ordersToday = orders.filter((order) =>
      isSameCalendarDay(order.created_at, today),
    );
    const newOrders = orders.filter(
      (order) => order.order_status === "NEW",
    ).length;
    const paidOrders = orders.filter(
      (order) => order.payment_status === "PAID",
    ).length;
    const pendingPayment = orders.filter(
      (order) => order.payment_status === "PENDING",
    ).length;
    const inDelivery = orders.filter(
      (order) => order.order_status === "OUT_FOR_DELIVERY",
    ).length;
    const deliveredOrders = orders.filter(
      (order) => order.order_status === "DELIVERED",
    ).length;
    const revenueTotal = orders.reduce(
      (total, order) => total + order.total_price,
      0,
    );
    const revenueToday = ordersToday.reduce(
      (total, order) => total + order.total_price,
      0,
    );

    return [
      { label: "Всего заказов", value: totalOrders.toLocaleString("ru-RU") },
      { label: "Новые заказы", value: newOrders.toLocaleString("ru-RU") },
      { label: "Заказы сегодня", value: ordersToday.length.toLocaleString("ru-RU") },
      { label: "Оплаченные заказы", value: paidOrders.toLocaleString("ru-RU") },
      { label: "Ожидают оплаты", value: pendingPayment.toLocaleString("ru-RU") },
      { label: "В доставке", value: inDelivery.toLocaleString("ru-RU") },
      {
        label: "Доставленные заказы",
        value: deliveredOrders.toLocaleString("ru-RU"),
      },
      { label: "Общая выручка", value: formatPrice(revenueTotal) },
      { label: "Выручка сегодня", value: formatPrice(revenueToday) },
    ];
  }, [orders]);

  if (!authChecked || !isAuthenticated) {
    return (
      <main style={styles.page}>
        <section style={styles.authPanel}>
          <p style={styles.eyebrow}>BellaFlore</p>
          <h1 style={styles.authTitle}>Проверка доступа</h1>
          <p style={styles.authText}>Открываем панель администратора.</p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <p style={styles.eyebrow}>BellaFlore</p>
          <h1 style={styles.title}>Панель администратора</h1>
        </div>
        <span style={styles.modeBadge}>Только просмотр</span>
      </section>

      {errorMessage && <p style={styles.error}>{errorMessage}</p>}
      {loading && <p style={styles.muted}>Загрузка показателей...</p>}

      <section style={styles.summaryGrid} aria-label="Сводка заказов">
        {summaryCards.map((card) => (
          <article style={styles.summaryCard} key={card.label}>
            <span style={styles.cardLabel}>{card.label}</span>
            <strong style={styles.cardValue}>{card.value}</strong>
          </article>
        ))}
      </section>

      <section style={styles.navSection} aria-label="Быстрая навигация">
        <div style={styles.sectionHeader}>
          <p style={styles.eyebrow}>Навигация</p>
          <h2 style={styles.sectionTitle}>Быстрый доступ</h2>
        </div>

        <div style={styles.quickGrid}>
          {quickLinks.map((link) => (
            <Link href={link.href} style={styles.quickLink} key={link.label}>
              <span style={styles.quickLabel}>{link.label}</span>
              <span style={styles.quickDescription}>{link.description}</span>
            </Link>
          ))}
        </div>
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
  summaryGrid: {
    width: "min(1180px, 100%)",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "14px",
  },
  summaryCard: {
    minHeight: "140px",
    display: "grid",
    alignContent: "space-between",
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    padding: "18px",
    background: "#ffffff",
    boxShadow: "0 12px 34px rgba(47, 42, 36, 0.08)",
  },
  cardLabel: {
    color: "#8a6b3d",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  cardValue: {
    display: "block",
    color: "#2f2a24",
    fontSize: "clamp(30px, 8vw, 46px)",
    lineHeight: 1,
    overflowWrap: "anywhere",
  },
  navSection: {
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
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },
  quickLink: {
    minHeight: "92px",
    display: "grid",
    alignContent: "center",
    gap: "6px",
    border: "1px solid rgba(138, 107, 61, 0.22)",
    borderRadius: "8px",
    padding: "14px",
    background: "#ffffff",
    color: "inherit",
    textDecoration: "none",
    WebkitTapHighlightColor: "rgba(138, 107, 61, 0.16)",
  },
  quickLabel: {
    color: "#2f2a24",
    fontSize: "18px",
    fontWeight: 900,
    lineHeight: 1.2,
  },
  quickDescription: {
    color: "#75695c",
    fontSize: "14px",
    lineHeight: 1.35,
  },
};
