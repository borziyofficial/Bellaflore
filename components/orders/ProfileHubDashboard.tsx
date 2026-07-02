// ==================================================
// SECTION: MY PROFILE
// РАЗДЕЛ: Компактное меню хаба профиля
// ==================================================
"use client";

import {
  PROFILE_HUB_MENU,
  type ProfileHubMenuItem,
  type ProfileHubSectionId,
} from "@/components/orders/profileHubTypes";
import styles from "@/components/orders/MyOrderHub.module.css";

type ProfileHubDashboardProps = {
  favoritesCount?: number;
  orderHint?: string | null;
  onSelectSection: (sectionId: ProfileHubSectionId) => void;
  onExternalAction: (sectionId: ProfileHubSectionId) => void;
};

function resolveMenuHint(
  item: ProfileHubMenuItem,
  favoritesCount: number,
  orderHint: string | null,
): string | undefined {
  if (item.id === "favorites" && favoritesCount > 0) {
    return `${favoritesCount}`;
  }

  if (item.id === "myOrder" && orderHint) {
    return orderHint;
  }

  return item.hint;
}

export function ProfileHubDashboard({
  favoritesCount = 0,
  orderHint = null,
  onSelectSection,
  onExternalAction,
}: ProfileHubDashboardProps) {
  return (
    <nav className={styles.menu} aria-label="Разделы профиля">
      {PROFILE_HUB_MENU.map((item) => {
        const hint = resolveMenuHint(item, favoritesCount, orderHint);

        return (
          <button
            key={item.id}
            type="button"
            className={styles.menuRow}
            onClick={() => {
              if (item.action === "external") {
                onExternalAction(item.id);
                return;
              }

              onSelectSection(item.id);
            }}
          >
            <span className={styles.menuRowLabel}>{item.label}</span>
            {hint ? <span className={styles.menuRowHint}>{hint}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}
