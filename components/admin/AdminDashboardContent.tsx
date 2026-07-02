// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админ-панель
//
// Purpose (EN):
// Dashboard metrics and overview content
//
// Назначение (RU):
// Контент дашборда с метриками
// ==================================================
"use client";

import styles from "@/components/admin/AdminDashboardContent.module.css";
import panelStyles from "@/components/admin/AdminPanel.module.css";
import {
  getActiveOrdersCount,
  getAverageOrderValue,
  getCancelledOrdersCount,
  getDeliveredOrdersCount,
  getNewOrdersCount,
  getOrdersInDeliveryCount,
  getTodayRevenue,
  getTotalOrders,
  getTotalRevenue,
} from "@/components/admin/adminDashboardMetrics";
import { useSyncExternalStore } from "react";

type DashboardMetric = {
  id: string;
  icon: string;
  label: string;
  value: string;
  hint: string;
};

function formatMetricCount(value: number): string {
  return value.toLocaleString("ru-RU");
}

function formatMetricRevenue(value: number): string {
  return `${Math.round(value).toLocaleString("ru-RU")} ₽`;
}

function buildDashboardMetrics(): DashboardMetric[] {
  const totalOrders = getTotalOrders();

  return [
    {
      id: "total-orders",
      icon: "📦",
      label: "Всего заказов",
      value: formatMetricCount(totalOrders),
      hint: totalOrders === 0 ? "Заказов пока нет" : "Все заказы в системе",
    },
    {
      id: "new-orders",
      icon: "🆕",
      label: "Новые",
      value: formatMetricCount(getNewOrdersCount()),
      hint: "Статус: создан",
    },
    {
      id: "active-orders",
      icon: "🌸",
      label: "В работе",
      value: formatMetricCount(getActiveOrdersCount()),
      hint: "Подтверждение и подготовка",
    },
    {
      id: "in-delivery",
      icon: "🚚",
      label: "В доставке",
      value: formatMetricCount(getOrdersInDeliveryCount()),
      hint: "Курьер в пути",
    },
    {
      id: "delivered",
      icon: "✅",
      label: "Доставлены",
      value: formatMetricCount(getDeliveredOrdersCount()),
      hint: "Завершённые заказы",
    },
    {
      id: "cancelled",
      icon: "❌",
      label: "Отменены",
      value: formatMetricCount(getCancelledOrdersCount()),
      hint: "Отменённые заказы",
    },
    {
      id: "today-revenue",
      icon: "💰",
      label: "Выручка сегодня",
      value: formatMetricRevenue(getTodayRevenue()),
      hint: "Заказы, созданные сегодня",
    },
    {
      id: "total-revenue",
      icon: "💎",
      label: "Общая выручка",
      value: formatMetricRevenue(getTotalRevenue()),
      hint: "Без отменённых заказов",
    },
    {
      id: "average-order",
      icon: "📈",
      label: "Средний чек",
      value: formatMetricRevenue(getAverageOrderValue()),
      hint: totalOrders === 0 ? "Нет данных для расчёта" : "Без отменённых заказов",
    },
  ];
}

export function AdminDashboardContent() {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const metrics = isClient ? buildDashboardMetrics() : [];

  return (
    <section
      className={styles.dashboardSection}
      aria-labelledby="admin-dashboard-title"
    >
      {/* ==================================================
SECTION: ADMIN
РАЗДЕЛ: Заголовок дашборда и сводка
Purpose (EN): Dashboard header and summary
Назначение (RU): Заголовок дашборда и сводка
================================================== */}
      <div className={styles.dashboardHeader}>
        <div>
          <p className={panelStyles.adminPlaceholderEyebrow}>CRM</p>
          <h2 id="admin-dashboard-title" className={panelStyles.adminPlaceholderTitle}>
            Dashboard
          </h2>
        </div>
        <p className={styles.dashboardSummary}>
          {isClient
            ? `${formatMetricCount(getTotalOrders())} заказов в локальной базе`
            : "Загрузка метрик..."}
        </p>
      </div>

      {/* ==================================================
SECTION: ADMIN
РАЗДЕЛ: Сетка карточек метрик
Purpose (EN): Metrics card grid
Назначение (RU): Сетка карточек метрик
================================================== */}
      <ul className={styles.metricsGrid}>
        {metrics.map((metric) => (
          <li key={metric.id} className={styles.metricCard}>
            <p className={styles.metricCardLabel}>
              <span className={styles.metricCardIcon} aria-hidden="true">
                {metric.icon}
              </span>
              {metric.label}
            </p>
            <p className={styles.metricCardValue}>{metric.value}</p>
            <p className={styles.metricCardHint}>{metric.hint}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
