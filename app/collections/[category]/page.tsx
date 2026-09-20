import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProtectedProductImage } from "@/components/images/ProtectedProductImage";
import { shouldUseUnoptimizedImage } from "@/components/images/imageLoadUtils";
import { absoluteUrl } from "@/app/seo";
import { listPublishedCatalogProducts } from "@/lib/catalogDb";
import { getSeoCollection, seoCollections } from "@/lib/catalogSeoCollections";
import styles from "@/app/collections/[category]/page.module.css";

export const revalidate = 60;

type Props = {
  params: Promise<{ category: string }>;
};

function minPrice(sizes: Partial<Record<"S" | "M" | "L" | "XL", number>>) {
  const values = Object.values(sizes).filter(
    (value): value is number => typeof value === "number" && value > 0,
  );
  return values.length > 0 ? Math.min(...values) : null;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const collection = getSeoCollection(category);
  if (!collection) return {};

  return {
    title: `${collection.title} с доставкой по Москве | BellaFlore`,
    description: collection.description,
    alternates: { canonical: `/collections/${collection.id}` },
    openGraph: {
      title: collection.title,
      description: collection.description,
      url: `/collections/${collection.id}`,
      siteName: "BellaFlore",
      locale: "ru_RU",
      type: "website",
    },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { category } = await params;
  const collection = getSeoCollection(category);
  if (!collection) notFound();

  let products = [] as Awaited<ReturnType<typeof listPublishedCatalogProducts>>;
  try {
    products = await listPublishedCatalogProducts();
  } catch {
    products = [];
  }

  const filtered = products.filter((product) => {
    if (collection.isNew) return product.isNew;
    return collection.categoryNames.includes(product.category);
  });

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.top}>
          <Link href="/" className={styles.brand}>BellaFlore</Link>
          <Link href="/#catalog" className={styles.back}>← Каталог</Link>
        </div>

        <header className={styles.hero}>
          <span className={styles.eyebrow}>Коллекция BellaFlore</span>
          <h1>{collection.h1}</h1>
          <p>{collection.description}</p>
        </header>

        {filtered.length > 0 ? (
          <div className={styles.grid}>
            {filtered.map((product, index) => {
              const price = minPrice(product.sizes);
              const slug = product.seoSlug || product.slug;
              return (
                <Link className={styles.card} href={`/catalog/${slug}`} key={product.id}>
                  <span className={styles.imageWrap}>
                    <ProtectedProductImage
                      src={product.imageUrl}
                      alt={product.seoImageAlt || product.title}
                      width={1080}
                      height={1350}
                      sizes="(max-width: 520px) 50vw, (max-width: 900px) 50vw, 33vw"
                      className={styles.image}
                      priority={index < 2}
                      unoptimized={shouldUseUnoptimizedImage(product.imageUrl)}
                    />
                  </span>
                  <span className={styles.meta}>
                    {product.catalogNumber ? <small>{product.catalogNumber}</small> : null}
                    <strong>{product.title}</strong>
                    {price ? <span>от {formatPrice(price)}</span> : null}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className={styles.empty}>Коллекция обновляется. Новые композиции появятся здесь после публикации.</p>
        )}
      </div>
    </main>
  );
}

export function generateStaticParams() {
  return seoCollections.map((collection) => ({ category: collection.id }));
}
