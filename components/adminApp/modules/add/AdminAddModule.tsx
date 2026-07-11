// ==================================================
// SECTION: ADMIN APP — Add bouquet module (Stage 2.8)
// ==================================================
"use client";

import { useState } from "react";
import { AdminBouquetForm } from "@/components/adminApp/modules/bouquets/AdminBouquetForm";
import type { BouquetDraft } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import { useAdminBouquets } from "@/components/adminApp/modules/bouquets/useAdminBouquets";
import {
  AdminActionButton,
  AdminFutureNote,
  AdminModuleHeader,
  AdminPanel,
} from "@/components/adminApp/shared/AdminModuleUi";
import ui from "@/components/adminApp/shared/AdminModuleUi.module.css";

export function AdminAddModule() {
  const { ready, persistenceMode, syncError, saveBouquet } = useAdminBouquets();
  const [formOpen, setFormOpen] = useState(true);
  const [lastCreatedName, setLastCreatedName] = useState("");

  const handleSave = (draft: BouquetDraft) => {
    const created = saveBouquet(draft);
    if (!created) {
      return false;
    }

    setLastCreatedName(created?.name ?? draft.name.trim());
    setFormOpen(false);
    return true;
  };

  return (
    <div className={ui.stack}>
      <AdminModuleHeader
        title="Добавить букет"
        subtitle="Быстрое создание карточки букета для админ-каталога"
        action={
          <button
            type="button"
            className={ui.actionButton}
            onClick={() => setFormOpen(true)}
          >
            Открыть форму
          </button>
        }
      />

      <AdminPanel title="Create flow">
        {!ready ? (
          <div className={ui.emptyZone}>Загрузка формы создания…</div>
        ) : lastCreatedName ? (
          <div className={ui.emptyZone}>
            Букет «{lastCreatedName}» сохранён. Можно создать следующий или перейти к списку.
          </div>
        ) : (
          <div className={ui.emptyZone}>
            Форма создания готова. Добавьте фото, категорию, размеры S / M / L / XL и сохраните
            букет.
          </div>
        )}
        <AdminFutureNote>
          Режим сохранения: {persistenceMode === "api" ? "серверная синхронизация" : "локальный кэш"}.
          {syncError ? ` ${syncError}` : ""}
        </AdminFutureNote>
        <div style={{ marginTop: 12 }}>
          <AdminActionButton href="/admin/bouquets" label="Перейти к списку букетов" variant="secondary" />
        </div>
      </AdminPanel>

      <AdminBouquetForm
        open={ready && formOpen}
        mode="create"
        onSave={handleSave}
        onCancel={() => setFormOpen(false)}
      />
    </div>
  );
}
