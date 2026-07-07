// ==================================================
// SECTION: ADMIN APP — Profile module (Stage 1 placeholder)
// ==================================================
"use client";

import {
  AdminModuleHeader,
  AdminPanel,
  AdminPlaceholderBadge,
} from "@/components/adminApp/shared/AdminModuleUi";
import ui from "@/components/adminApp/shared/AdminModuleUi.module.css";

export function AdminProfileModule() {
  return (
    <div className={ui.stack}>
      <AdminModuleHeader
        title="Profile"
        subtitle="Аккаунт администратора и настройки магазина"
        action={<AdminPlaceholderBadge />}
      />

      <AdminPanel title="Admin account">
        <ul className={ui.list}>
          <li className={ui.listItem}>
            <span>Account details</span>
            <span className={ui.listItemMuted}>Stage 2</span>
          </li>
          <li className={ui.listItem}>
            <span>Role & permissions</span>
            <span className={ui.listItemMuted}>Stage 2</span>
          </li>
        </ul>
      </AdminPanel>

      <AdminPanel title="Telegram notifications">
        <div className={ui.emptyZone}>Подключение Telegram-уведомлений — Stage 2.</div>
      </AdminPanel>

      <AdminPanel title="Store settings">
        <div className={ui.emptyZone}>Настройки магазина — Stage 2.</div>
      </AdminPanel>

      <AdminPanel title="Logout">
        <p className={ui.listItemMuted}>
          Кнопка «Выйти» доступна в верхней панели приложения.
        </p>
      </AdminPanel>
    </div>
  );
}
