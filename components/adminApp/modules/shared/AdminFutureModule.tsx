// ==================================================
// SECTION: ADMIN APP — Future module placeholder
// ==================================================
"use client";

import {
  AdminFutureNote,
  AdminModuleHeader,
  AdminPanel,
  AdminPlaceholderBadge,
} from "@/components/adminApp/shared/AdminModuleUi";
import ui from "@/components/adminApp/shared/AdminModuleUi.module.css";

type AdminFutureModuleProps = {
  title: string;
  subtitle: string;
  bullets?: string[];
};

export function AdminFutureModule({
  title,
  subtitle,
  bullets = [],
}: AdminFutureModuleProps) {
  return (
    <div className={ui.stack}>
      <AdminModuleHeader
        title={title}
        subtitle={subtitle}
        action={<AdminPlaceholderBadge />}
      />

      <AdminPanel title="Module status">
        <AdminFutureNote>
          This module is registered in the admin architecture and will be implemented in a future stage.
        </AdminFutureNote>
      </AdminPanel>

      {bullets.length > 0 ? (
        <AdminPanel title="Planned capabilities">
          <ul className={ui.list}>
            {bullets.map((item) => (
              <li key={item} className={ui.listItem}>
                <span>{item}</span>
                <span className={ui.listItemMuted}>Planned</span>
              </li>
            ))}
          </ul>
        </AdminPanel>
      ) : null}
    </div>
  );
}
