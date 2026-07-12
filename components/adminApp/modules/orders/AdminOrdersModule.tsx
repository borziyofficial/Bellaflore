// ==================================================
// SECTION: ADMIN APP — Orders module (Stage 1 placeholder)
// ==================================================
"use client";

import { useState } from "react";
import {
  AdminModuleHeader,
  AdminPanel,
  AdminPlaceholderBadge,
} from "@/components/adminApp/shared/AdminModuleUi";
import ui from "@/components/adminApp/shared/AdminModuleUi.module.css";

const ORDER_TABS = [
  { id: "new", label: "Новые заказы" },
  { id: "progress", label: "В работе" },
  { id: "delivered", label: "Доставлены" },
  { id: "cancelled", label: "Отменены" },
] as const;

type OrderTabId = (typeof ORDER_TABS)[number]["id"];

const TAB_COPY: Record<OrderTabId, string> = {
  new: "Новые заказы появятся здесь.",
  progress: "Заказы в работе появятся здесь.",
  delivered: "Доставленные заказы появятся здесь.",
  cancelled: "Отменённые заказы появятся здесь.",
};

export function AdminOrdersModule() {
  const [activeTab, setActiveTab] = useState<OrderTabId>("new");

  return (
    <div className={ui.stack}>
      <AdminModuleHeader
        title="Заказы"
        subtitle="Воронка заказов"
        action={<AdminPlaceholderBadge />}
      />

      <div className={ui.tabRow} role="tablist" aria-label="Статус заказа">
        {ORDER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${ui.tabChip} ${activeTab === tab.id ? ui.tabChipActive : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AdminPanel title={ORDER_TABS.find((tab) => tab.id === activeTab)?.label}>
        <div className={ui.emptyZone}>{TAB_COPY[activeTab]}</div>
      </AdminPanel>
    </div>
  );
}
