// ==================================================
// SECTION: ADMIN APP — Dashboard module
// ==================================================
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  type AdminOrder,
  buildDashboardOrderMetrics,
  fetchAdminOrders,
  formatOrderPrice,
  orderStatusLabels,
} from "@/lib/orders/adminClient";
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
  { label: "Клиенты", hint: "CRM", href: "/admin/customers" },
  { label: "Зоны доставки", hint: "Границы и тарифы", href: "/admin/delivery-zones" },
];

export function AdminDashboardModule() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadOrders() {
    setLoading(true);
    setErrorMessage("");
    try {
      setOrders(await fetchAdminOrders());
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Не удалось загрузить сводку заказов.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadOrders(), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const metrics = useMemo(() => buildDashboardOrderMetrics(orders), [orders]);

  return (
    <div className={ui.stack}>
      <AdminModuleHeader
        title="Главная"
        subtitle="Сводка из Production Orders DB"
        action={
          <button className={ui.actionButton} type="button" onClick={loadOrders}>
            Обновить
          </button>
        }
      />

      {errorMessage ? <p>{errorMessage}</p> : null}

      <div className={ui.statGrid} aria-busy={loading}>
        <AdminStatCard
          label="Заказы сегодня"
          value={loading ? "—" : String(metrics.todayOrders)}
          hint="По Москве"
        />
        <AdminStatCard
          label="Выручка сегодня"
          value={loading ? "—" : formatOrderPrice(metrics.todayRevenue)}
          hint="Без отменённых"
        />
        <AdminStatCard
          label="Новые заказы"
          value={loading ? "—" : String(metrics.newOrders)}
          hint="Ожидают обработки"
        />
        <AdminStatCard
          label="Всего заказов"
          value={loading ? "—" : String(metrics.totalOrders)}
          hint="Последние 100"
        />
      </div>

      <AdminPanel title="Статусы заказов">
        {loading ? (
          <div className={ui.emptyZone}>Загружаем статусы…</div>
        ) : (
          <ul className={ui.list}>
            {Object.entries(metrics.statusCounts).map(([status, count]) => (
              <li key={status} className={ui.listItem}>
                <span>{orderStatusLabels[status as AdminOrder["status"]]}</span>
                <span className={ui.listItemMuted}>{count}</span>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>

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
    </div>
  );
}
