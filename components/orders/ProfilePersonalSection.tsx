// ==================================================
// SECTION: MY PROFILE
// РАЗДЕЛ: Личные данные (секция профиля)
// ==================================================
"use client";

import styles from "@/components/orders/MyOrderPassport.module.css";

type ProfilePersonalSectionProps = {
  recipientName: string;
  phone: string;
};

function displayValue(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "Не указано";
}

export function ProfilePersonalSection({
  recipientName,
  phone,
}: ProfilePersonalSectionProps) {
  return (
    <article className={styles.passport} aria-label="Личные данные">
      <div className={styles.row}>
        <span className={styles.label}>Имя</span>
        <span className={styles.value}>{displayValue(recipientName)}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Телефон</span>
        <span className={styles.value}>{displayValue(phone)}</span>
      </div>
    </article>
  );
}
