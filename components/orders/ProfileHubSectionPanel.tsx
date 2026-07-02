// ==================================================
// SECTION: MY PROFILE
// РАЗДЕЛ: Вложенная секция хаба профиля
// ==================================================
"use client";

import { type ReactNode } from "react";
import styles from "@/components/orders/MyOrderHub.module.css";

type ProfileHubSectionPanelProps = {
  title: string;
  onBack: () => void;
  children: ReactNode;
  expanded?: boolean;
};

export function ProfileHubSectionPanel({
  title,
  onBack,
  children,
  expanded = false,
}: ProfileHubSectionPanelProps) {
  return (
    <div className={`${styles.section} ${expanded ? styles.sectionExpanded : ""}`}>
      <div className={styles.sectionHeader}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          <span className={styles.backButtonIcon} aria-hidden="true">
            ←
          </span>
          <span className={styles.backButtonLabel}>Назад</span>
        </button>
        <h3 className={styles.sectionTitle}>{title}</h3>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  );
}
