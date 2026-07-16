import styles from "@/components/adminApp/modules/smartBanner/AdminSmartBannerModule.module.css";

export default function SmartBannerLoading() {
  return (
    <div className={styles.moduleRoot} aria-label="Загрузка умного баннера" aria-busy="true">
      <div className={styles.loadingHeader} />
      <div className={styles.loadingGrid}>
        <div className={styles.loadingPanel} />
        <div className={styles.loadingPreview} />
      </div>
    </div>
  );
}
