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
  AdminStatCard,
} from "@/components/adminApp/shared/AdminModuleUi";
import ui from "@/components/adminApp/shared/AdminModuleUi.module.css";

const QUICK_ACTIONS = [
  { label: "Добавить букет", hint: "Создать", href: "/admin/add" },
  { label: "Букеты", hint: "Каталог", href: "/admin/bouquets" },
  { label: "Заказы", hint: "Поток заказов", href: "/admin/orders" },
  { label: "Умный баннер", hint: "Главная страница", href: "/admin/smart-banner" },
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
        title="Главная"
        subtitle="Сводка магазина на сегодня"
      />

      <div className={ui.statGrid}>
        <AdminStatCard label="Заказы сегодня" value={String(todayOrders)} hint="Заказы за сегодня" />
        <AdminStatCard
          label="Выручка сегодня"
          value={formatRub(todayRevenue)}
          hint="Выручка за сегодня"
        />
        <AdminStatCard
          label="Ожидают обработки"
          value={String(pendingOrders)}
          hint="Ожидают обработки"
        />
        <AdminStatCard label="Низкий остаток" value="—" hint="Появится на следующем этапе" />
      </div>

      <AdminPanel title="Быстрые действия">
        <div className={ui.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href} className={ui.quickAction}>
              <span className={ui.quickActionLabel}>{action.label}</span>
              <span className={ui.quickActionHint}>{action.hint}</span>
            </Link>
          ))}
        </div>
      </AdminPanel>

      <AdminPanel title="Последние уведомления">
        <ul className={ui.list}>
          {NOTIFICATIONS.map((item) => (
            <li key={item} className={ui.listItem}>
              <span>{item}</span>
              <span className={ui.listItemMuted}>Демо</span>
            </li>
          ))}
        </ul>
      </AdminPanel>
    </div>
  );
}
