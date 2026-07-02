// ==================================================
// SECTION: MY PROFILE
// РАЗДЕЛ: Заглушки будущих секций профиля
// ==================================================
"use client";

import styles from "@/components/orders/MyOrderPassport.module.css";

type ProfileHubPlaceholderSectionProps = {
  title: string;
  message: string;
};

export function ProfileHubPlaceholderSection({
  title,
  message,
}: ProfileHubPlaceholderSectionProps) {
  return (
    <div className={styles.empty} role="status">
      <p className={styles.emptyTitle}>{title}</p>
      <p className={styles.emptyCopy}>{message}</p>
    </div>
  );
}
