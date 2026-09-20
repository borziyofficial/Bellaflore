// ==================================================
// SECTION: Public Catalog Product Page
// РАЗДЕЛ: Страница товара /catalog/[slug]
// ==================================================
import Link from "next/link";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import { ProtectedProductImage } from "@/components/images/ProtectedProductImage";
import { ProductReviews } from "@/components/product/ProductReviews";
import { shouldUseUnoptimizedImage } from "@/components/images/imageLoadUtils";
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
  const catalogNumber = record.metadata?.catalogNumber ?? product.catalogNumber;
  const pageTitle = record.metadata.adminSeoDraft?.seoH1 || record.title;
  const heading =
    pageTitle.startsWith("Букет") ? pageTitle : `Букет «${record.title}»`;
  const orderHref = `/?product=${encodeURIComponent(product.id)}#catalog`;
  const galleryImages = [
    {
      id: "primary",
      src: product.src,
      alt: product.alt,
      width: product.width,
      height: product.height,
    },
    ...(product.galleryImages ?? []).filter((image) => image.src !== product.src),
  ].slice(0, 4);
  const sizeOptions =
    product.sizes && product.sizes.length > 0
      ? product.sizes
      : [{ label: "S", price: product.priceRub }];

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
        <div className={styles.gallery} aria-label={`Фотографии ${product.title}`}>
          {galleryImages.map((image, index) => (
            <div
              className={index === 0 ? styles.mediaPrimary : styles.mediaSecondary}
              key={image.id}
            >
              <ProtectedProductImage
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                className={styles.image}
                priority={index === 0}
                sizes={index === 0 ? "(max-width: 899px) 100vw, 460px" : "(max-width: 899px) 50vw, 220px"}
                unoptimized={shouldUseUnoptimizedImage(image.src)}
              />
            </div>
          ))}
        </div>

        <div className={styles.details}>
          {product.category ? (
            <p className={styles.category}>{product.category}</p>
          ) : null}
          {catalogNumber ? (
            <p className={styles.category}>
              <small>Каталог: {catalogNumber}</small>
            </p>
          ) : null}
          <h1 className={styles.title}>{heading}</h1>
          <p className={styles.lead}>{product.description}</p>

          <p className={styles.price}>от {formatPrice(sizeOptions[0]?.price ?? product.priceRub)}</p>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Размер и стоимость</h2>
            <ul className={styles.sizes}>
              {sizeOptions.map((size) => (
                <li className={styles.sizeItem} key={size.label}>
                  <span>{size.label}</span>
                  <strong>{formatPrice(size.price)}</strong>
                </li>
              ))}
            </ul>
          </section>

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

          <div className={styles.trustGrid} aria-label="Сервис BellaFlore">
            <span>Фото букета по запросу</span>
            <span>Открытка к заказу</span>
            <span>Расчёт доставки по адресу</span>
          </div>

          <div className={styles.actions}>
            <Link href={orderHref} className={styles.primaryButton}>
              Выбрать размер и заказать
            </Link>
            <Link href="/offer" className={styles.secondaryLink}>
              Условия заказа и доставки
            </Link>
            <p className={styles.deliveryHint}>
              {product.deliveryHint ?? "Доставка по Москве и Московской области"}
            </p>
          </div>

          <ProductReviews
            productId={catalogNumber ?? product.id}
            productTitle={record.title}
          />
        </div>
      </article>
    </main>
  );
}
