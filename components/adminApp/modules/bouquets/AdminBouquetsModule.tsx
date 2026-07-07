// ==================================================
// SECTION: ADMIN APP — Bouquets module (Stage 1 placeholder)
// ==================================================
"use client";

import {
  AdminActionButton,
  AdminFutureNote,
  AdminModuleHeader,
  AdminPanel,
  AdminPlaceholderBadge,
} from "@/components/adminApp/shared/AdminModuleUi";
import ui from "@/components/adminApp/shared/AdminModuleUi.module.css";

export function AdminBouquetsModule() {
  return (
    <div className={ui.stack}>
      <AdminModuleHeader
        title="Bouquets"
        subtitle="Каталог букетов — список, фото и размеры"
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <AdminPlaceholderBadge />
            <AdminActionButton href="/admin/products" label="Open manager" variant="secondary" />
          </div>
        }
      />

      <AdminPanel title="Bouquet list">
        <div className={ui.emptyZone}>
          Список букетов появится здесь. Полный менеджер каталога доступен через Open manager.
        </div>
      </AdminPanel>

      <AdminPanel title="Add bouquet">
        <AdminFutureNote>
          Быстрое добавление букета с фото и размерами S / M / L / XL — Stage 2.
        </AdminFutureNote>
        <div style={{ marginTop: 12 }}>
          <AdminActionButton href="/admin/add" label="Go to Add" />
        </div>
      </AdminPanel>

      <AdminPanel title="Photo upload & sizes">
        <ul className={ui.list}>
          <li className={ui.listItem}>
            <span>Photo upload area</span>
            <span className={ui.listItemMuted}>Future</span>
          </li>
          <li className={ui.listItem}>
            <span>Size system S / M / L / XL</span>
            <span className={ui.listItemMuted}>Future</span>
          </li>
        </ul>
      </AdminPanel>
    </div>
  );
}
