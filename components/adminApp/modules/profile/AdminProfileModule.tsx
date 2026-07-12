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
        title="Профиль"
        subtitle="Аккаунт администратора и настройки магазина"
        action={<AdminPlaceholderBadge />}
      />

      <AdminPanel title="Аккаунт администратора">
        <ul className={ui.list}>
          <li className={ui.listItem}>
            <span>Данные аккаунта</span>
            <span className={ui.listItemMuted}>Скоро</span>
          </li>
          <li className={ui.listItem}>
            <span>Роль и права доступа</span>
            <span className={ui.listItemMuted}>Скоро</span>
          </li>
        </ul>
      </AdminPanel>

      <AdminPanel title="Уведомления в Telegram">
        <div className={ui.emptyZone}>Подключение Telegram-уведомлений появится на следующем этапе.</div>
      </AdminPanel>

      <AdminPanel title="Настройки магазина">
        <div className={ui.emptyZone}>Настройки магазина появятся на следующем этапе.</div>
      </AdminPanel>

      <AdminPanel title="Выход">
        <p className={ui.listItemMuted}>
          Кнопка «Выйти» доступна в верхней панели приложения.
        </p>
      </AdminPanel>
    </div>
  );
}
