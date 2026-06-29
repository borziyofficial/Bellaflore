import styles from "@/components/photoManager/ImageOptimizerFoundation.module.css";

const OPTIMIZER_ITEMS = [
  "WebP conversion",
  "JPG fallback",
  "AVIF future",
  "Responsive images",
  "Lazy loading",
  "SrcSet",
  "Retina images",
  "Compression",
  "EXIF removal",
  "CDN placeholder",
];

export function ImageOptimizerFoundation() {
  return (
    <section className={styles.panel}>
      <h4 className={styles.title}>⚙️ Image Optimizer</h4>
      <ul className={styles.list}>
        {OPTIMIZER_ITEMS.map((item) => (
          <li key={item} className={styles.item}>
            <span className={styles.badge}>planned</span>
            {item}
          </li>
        ))}
      </ul>
      <p className={styles.note}>
        Foundation-блок будущей оптимизации изображений. Реальная обработка пока не
        подключена.
      </p>
    </section>
  );
}
