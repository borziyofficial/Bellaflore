// ==================================================
// SECTION: ADMIN WORKSPACE
// РАЗДЕЛ: Dashboard foundation UI
// ==================================================
import Link from "next/link";
import { formatAdminRoleLabel } from "@/components/adminEntry/adminNavigationItems";
import { CatalogAdminManager } from "@/components/catalogAdmin";
import { PhotoManagerFoundation } from "@/components/photoManager";
import { PhotoManagerProvider } from "@/components/photoManager/PhotoManagerProvider";
import { ProductEditorFoundation } from "@/components/productEditor";
import {
  ProductListFoundation,
  ProductPhotoBindingBridge,
  ProductStorageProvider,
} from "@/components/productStorage";
import {
  ADMIN_WORKSPACE_QUICK_LINKS,
  ADMIN_WORKSPACE_ROADMAP,
  ADMIN_WORKSPACE_STAT_CARDS,
} from "@/components/adminWorkspace/adminWorkspaceDashboardFoundation";
import styles from "@/components/adminWorkspace/AdminWorkspaceDashboard.module.css";

type AdminWorkspaceDashboardProps = {
  adminUserName: string;
  adminUserRole: string;
};

const STAT_TONE_CLASS = {
  neutral: styles.toneNeutral,
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  info: styles.toneInfo,
} as const;

export function AdminWorkspaceDashboard({
  adminUserName,
  adminUserRole,
}: AdminWorkspaceDashboardProps) {
  const roleLabel = formatAdminRoleLabel(adminUserRole);

  return (
    <PhotoManagerProvider>
      <ProductStorageProvider>
        <ProductPhotoBindingBridge />
        <div className={styles.dashboard}>
      <section className={styles.heroCard}>
        <p className={styles.eyebrow}>Bellaflore · Админ workspace</p>
        <h2 className={styles.heroTitle}>📈 Панель управления Bellaflore</h2>
        <p className={styles.heroLead}>
          Основное рабочее место администратора: быстрые переходы, сводка и
          roadmap следующих модулей.
        </p>
        <div className={styles.heroMetaRow}>
          <p className={styles.metaPill}>
            Пользователь: {adminUserName} / {roleLabel}
          </p>
          <p className={`${styles.metaPill} ${styles.sessionPill}`}>
            <span className={styles.sessionDot} aria-hidden="true" />
            Защищённая сессия активна
          </p>
        </div>
      </section>

      <section className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>Быстрые переходы</h3>
        <div className={styles.quickGrid}>
          {ADMIN_WORKSPACE_QUICK_LINKS.map((item) =>
            item.href ? (
              <Link key={item.id} href={item.href} className={styles.quickLink}>
                <span className={styles.quickLabel}>{item.label}</span>
                <span className={styles.quickNote}>{item.note}</span>
              </Link>
            ) : (
              <div key={item.id} className={styles.quickStub} aria-disabled="true">
                <span className={styles.quickLabel}>{item.label}</span>
                <span className={styles.quickNote}>{item.note}</span>
              </div>
            ),
          )}
        </div>
      </section>

      <ProductListFoundation />

      <CatalogAdminManager />

      <PhotoManagerFoundation />

      <ProductEditorFoundation />

      <section className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>Сводка дня</h3>
        <div className={styles.statsGrid}>
          {ADMIN_WORKSPACE_STAT_CARDS.map((stat) => (
            <article
              key={stat.id}
              className={`${styles.statCard} ${STAT_TONE_CLASS[stat.tone]}`}
            >
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue}>{stat.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>Следующие рабочие модули</h3>
        <div className={styles.roadmapList}>
          {ADMIN_WORKSPACE_ROADMAP.map((item) => (
            <article key={item.stage} className={styles.roadmapItem}>
              <p className={styles.roadmapStage}>{item.stage}</p>
              <p className={styles.roadmapTitle}>{item.title}</p>
              <p className={styles.roadmapDescription}>{item.description}</p>
            </article>
          ))}
        </div>
      </section>
        </div>
      </ProductStorageProvider>
    </PhotoManagerProvider>
  );
}
