// ==================================================
// SECTION: Public Catalog Product Page
// РАЗДЕЛ: Страница товара /catalog/[slug]
// ==================================================
import Image from "next/image";
import Link from "next/link";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import type { CatalogProduct } from "@/data/catalogProducts";
import styles from "@/components/catalog/CatalogProductPage.module.css";

type CatalogProductPageViewProps = {
  product: CatalogProduct;
  record: CatalogProductRecord;
};

function formatPrice(priceRub: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(priceRub);
}

export function CatalogProductPageView({
  product,
  record,
}: CatalogProductPageViewProps) {
  const pageTitle = record.metadata.adminSeoDraft?.seoH1 || record.title;
  const heading =
    pageTitle.startsWith("Букет") ? pageTitle : `Букет «${record.title}»`;
  const orderHref = `/?product=${encodeURIComponent(product.id)}#catalog`;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          Bellaflore
        </Link>
        <Link href="/#catalog" className={styles.backLink}>
          ← Каталог
        </Link>
      </header>

      <article className={styles.layout}>
        <div className={styles.media}>
          <Image
            src={product.src}
            alt={product.alt}
            width={product.width}
            height={product.height}
            className={styles.image}
            priority
            unoptimized={product.src.includes("blob.vercel-storage.com")}
          />
        </div>

        <div className={styles.details}>
          {product.category ? (
            <p className={styles.category}>{product.category}</p>
          ) : null}
          <h1 className={styles.title}>{heading}</h1>
          <p className={styles.lead}>{product.description}</p>

          <p className={styles.price}>{formatPrice(product.priceRub)}</p>

          {product.composition ? (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Состав</h2>
              <p>{product.composition}</p>
            </section>
          ) : null}

          {record.fullDescription ? (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>О букете</h2>
              <p>{record.fullDescription}</p>
            </section>
          ) : null}

          <div className={styles.actions}>
            <Link href={orderHref} className={styles.primaryButton}>
              Заказать букет
            </Link>
            <p className={styles.deliveryHint}>
              {product.deliveryHint ?? "Доставка сегодня по Москве и области"}
            </p>
          </div>
        </div>
      </article>
    </main>
  );
}
