// ==================================================
// SECTION: ADMIN APP — Dashboard module (Stage 1 placeholder)
// ==================================================
"use client";

import Link from "next/link";
import {
  getNewOrdersCount,
  getTodayOrdersCount,
  getTodayRevenue,
} from "@/components/admin/adminDashboardMetrics";
import {
  AdminModuleHeader,
  AdminPanel,
  AdminPlaceholderBadge,
  AdminStatCard,
} from "@/components/adminApp/shared/AdminModuleUi";
import ui from "@/components/adminApp/shared/AdminModuleUi.module.css";

const QUICK_ACTIONS = [
  { label: "Добавить букет", hint: "Create", href: "/admin/add" },
  { label: "Букеты", hint: "Catalog", href: "/admin/bouquets" },
  { label: "Заказы", hint: "Pipeline", href: "/admin/orders" },
  { label: "Smart Banner", hint: "Soon", href: "/admin/smart-banner" },
];

const NOTIFICATIONS = [
  "Новый заказ ожидает подтверждения",
  "Низкий остаток: White Pearl",
  "Доставка на сегодня: 3 маршрута",
];

function formatRub(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function AdminDashboardModule() {
  const todayOrders = getTodayOrdersCount();
  const todayRevenue = getTodayRevenue();
  const pendingOrders = getNewOrdersCount();

  return (
    <div className={ui.stack}>
      <AdminModuleHeader
        title="Dashboard"
        subtitle="Сводка магазина на сегодня"
        action={<AdminPlaceholderBadge />}
      />

      <div className={ui.statGrid}>
        <AdminStatCard label="Today orders" value={String(todayOrders)} hint="Заказы за сегодня" />
        <AdminStatCard
          label="Today revenue"
          value={formatRub(todayRevenue)}
          hint="Выручка за сегодня"
        />
        <AdminStatCard
          label="Pending orders"
          value={String(pendingOrders)}
          hint="Ожидают обработки"
        />
        <AdminStatCard label="Low stock" value="—" hint="Stage 2 inventory" />
      </div>

      <AdminPanel title="Quick actions">
        <div className={ui.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href} className={ui.quickAction}>
              <span className={ui.quickActionLabel}>{action.label}</span>
              <span className={ui.quickActionHint}>{action.hint}</span>
            </Link>
          ))}
        </div>
      </AdminPanel>

      <AdminPanel title="Latest notifications">
        <ul className={ui.list}>
          {NOTIFICATIONS.map((item) => (
            <li key={item} className={ui.listItem}>
              <span>{item}</span>
              <span className={ui.listItemMuted}>Demo</span>
            </li>
          ))}
        </ul>
      </AdminPanel>
    </div>
  );
}
