// ==================================================
// SECTION: ADMIN FOUNDATION
// РАЗДЕЛ: Статический loader для client-only admin shell
// ==================================================
import styles from "@/components/adminFoundation/AdminFoundationPage.module.css";

export function AdminFoundationPageLoader() {
  return (
    <main className={styles.page}>
      <section className={styles.authShell} aria-label="Загрузка BellaFlore Admin">
        <div className={styles.authHero}>
          <p className={styles.eyebrow}>BellaFlore Admin</p>
          <h1 className={styles.title}>BellaFlore Admin</h1>
          <p className={styles.lead}>
            Локальный доступ к админ-фундаменту. Пока это только пароль и
            заглушки разделов.
          </p>
        </div>
      </section>
    </main>
  );
}
