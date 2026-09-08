import styles from "@/components/adminApp/modules/deliveryZones/AdminDeliveryZonesModule.module.css";

export default function DeliveryZonesLoading() {
  return (
    <div className={styles.moduleRoot} aria-label="Загрузка зон доставки" aria-busy="true">
      <div className={styles.loadingHeader} />
      <div className={styles.loadingPanel} />
    </div>
  );
}
