// ==================================================
// SECTION: ADMIN APP — Shared module UI
// РАЗДЕЛ: Общие UI-компоненты модулей (Stage 1)
// ==================================================
import type { ReactNode } from "react";
import styles from "@/components/adminApp/shared/AdminModuleUi.module.css";

export function AdminModuleHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className={styles.header}>
      <div>
        <h2 className={styles.title}>{title}</h2>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
      {action ? <div className={styles.headerAction}>{action}</div> : null}
    </header>
  );
}

export function AdminStatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <article className={styles.statCard}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
      {hint ? <p className={styles.statHint}>{hint}</p> : null}
    </article>
  );
}

export function AdminPanel({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${styles.panel} ${className ?? ""}`.trim()}>
      {title ? <h3 className={styles.panelTitle}>{title}</h3> : null}
      {children}
    </section>
  );
}

export function AdminPlaceholderBadge() {
  return <span className={styles.stageBadge}>В разработке</span>;
}

export function AdminFutureNote({ children }: { children: ReactNode }) {
  return <p className={styles.futureNote}>{children}</p>;
}

export function AdminActionButton({
  href,
  label,
  variant = "primary",
}: {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <a
      href={href}
      className={`${styles.actionButton} ${
        variant === "secondary" ? styles.actionButtonSecondary : ""
      }`.trim()}
    >
      {label}
    </a>
  );
}
