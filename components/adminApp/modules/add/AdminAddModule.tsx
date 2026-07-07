// ==================================================
// SECTION: ADMIN APP — Add bouquet module (Stage 1 placeholder)
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

export function AdminAddModule() {
  return (
    <div className={ui.stack}>
      <AdminModuleHeader
        title="Add bouquet"
        subtitle="Создание нового букета"
        action={<AdminPlaceholderBadge />}
      />

      <AdminPanel title="Create flow">
        <div className={ui.emptyZone}>
          Форма быстрого создания букета будет здесь на Stage 2.
        </div>
        <AdminFutureNote>
          План: название, категория, цена, фото, размеры S / M / L / XL, публикация в каталог.
        </AdminFutureNote>
        <div style={{ marginTop: 12 }}>
          <AdminActionButton href="/admin/products" label="Use catalog manager" variant="secondary" />
        </div>
      </AdminPanel>
    </div>
  );
}
