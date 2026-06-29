// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админ-панель
//
// Purpose (EN):
// Shared layout shell for admin workspace sections
//
// Назначение (RU):
// Общий layout админ-workspace
// ==================================================
import type { ReactNode } from "react";
import Link from "next/link";
import type { AdminWorkspaceSection } from "@/components/adminWorkspace/adminWorkspaceTypes";
import styles from "@/components/adminWorkspace/AdminWorkspaceLayout.module.css";

type AdminWorkspaceLayoutProps = {
  title: string;
  description: string;
  adminUserName: string;
  adminUserRole: string;
  children?: ReactNode;
  sections?: AdminWorkspaceSection[];
  backHref?: string;
};

export function AdminWorkspaceLayout({
  title,
  description,
  children,
  sections,
  backHref = "/admin",
}: AdminWorkspaceLayoutProps) {
  return (
    <div className={styles.stack}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Bellaflore · Рабочее пространство</p>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.muted} style={{ marginTop: "12px" }}>
          {description}
        </p>
        {backHref ? (
          <p className={styles.muted} style={{ marginTop: "12px" }}>
            <Link href={backHref}>← Назад в workspace</Link>
          </p>
        ) : null}
      </section>

      {sections && sections.length > 0 ? (
        <section className={styles.card}>
          <p className={styles.eyebrow}>Доступные разделы</p>
          <div className={styles.sectionGrid}>
            {sections.map((section) => (
              <Link
                key={section.sectionId}
                href={section.sectionPath}
                className={styles.sectionLink}
              >
                <span className={styles.sectionName}>{section.sectionName}</span>
                <span className={styles.sectionDescription}>
                  {section.sectionDescription}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {children}
    </div>
  );
}

export function AdminWorkspaceDeniedPanel({
  message,
}: {
  message: string;
}) {
  return (
    <section className={`${styles.card} ${styles.deniedCard}`}>
      <p className={styles.eyebrow}>Доступ запрещён</p>
      <h2 className={styles.deniedTitle}>Доступ запрещён</h2>
      <p className={styles.deniedMessage}>{message}</p>
    </section>
  );
}

export function AdminWorkspacePlaceholderPanel({
  sectionName,
}: {
  sectionName: string;
}) {
  return (
    <section className={styles.card}>
      <p className={styles.eyebrow}>Заглушка раздела</p>
      <h2 className={styles.title}>{sectionName}</h2>
      <p className={styles.muted} style={{ marginTop: "12px" }}>
        Раздел подготовлен
      </p>
    </section>
  );
}
