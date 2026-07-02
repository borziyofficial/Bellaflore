// ==================================================
// SECTION: Catalog Product Route
// РАЗДЕЛ: /catalog/[slug] — публичная карточка товара из PostgreSQL
// ==================================================
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { absoluteUrl, metadataBase } from "@/app/seo";
import { CatalogProductPageView } from "@/components/catalog/CatalogProductPageView";
import { resolvePublishedCatalogProduct } from "@/lib/catalogDb/resolvePublishedCatalogProduct";

export const revalidate = 60;

type CatalogProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function buildAbsoluteImageUrl(imagePath: string): string {
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  return absoluteUrl(imagePath.startsWith("/") ? imagePath : `/${imagePath}`);
}

export async function generateMetadata({
  params,
}: CatalogProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolvePublishedCatalogProduct(decodeURIComponent(slug));

  if (!resolved) {
    return {};
  }

  const { record } = resolved;
  const canonicalSlug = record.seo.slug;
  const title = record.seo.title || record.title;
  const description = record.seo.description || record.shortDescription;
  const openGraph = record.seo.openGraph;
  const imageUrl = buildAbsoluteImageUrl(
    openGraph.imageUrl || record.images[0]?.url || "/0002.jpg",
  );

  return {
    metadataBase,
    title,
    description,
    alternates: {
      canonical: `/catalog/${canonicalSlug}`,
    },
    openGraph: {
      title: openGraph.title || title,
      description: openGraph.description || description,
      type: "website",
      locale: "ru_RU",
      siteName: "Bellaflore",
      url: `/catalog/${canonicalSlug}`,
      images: [
        {
          url: imageUrl,
          width: record.images[0]?.width ?? 1080,
          height: record.images[0]?.height ?? 1350,
          alt: record.images[0]?.alt || record.title,
        },
      ],
    },
  };
}

export default async function CatalogProductPage({ params }: CatalogProductPageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const resolved = await resolvePublishedCatalogProduct(slug);

  if (!resolved) {
    notFound();
  }

  const { product, record, stored } = resolved;
  const canonicalSlug = record.seo.slug;

  if (slug !== canonicalSlug && slug !== stored.id) {
    permanentRedirect(`/catalog/${canonicalSlug}`);
  }

  const schemaJsonLd =
    Object.keys(record.seo.schemaJsonLd ?? {}).length > 0
      ? {
          ...record.seo.schemaJsonLd,
          url: absoluteUrl(`/catalog/${canonicalSlug}`),
        }
      : {
          "@context": "https://schema.org",
          "@type": "Product",
          name: record.title,
          description: record.seo.description || record.shortDescription,
          image: buildAbsoluteImageUrl(record.images[0]?.url || "/0002.jpg"),
          brand: {
            "@type": "Brand",
            name: "Bellaflore",
          },
          offers: {
            "@type": "Offer",
            priceCurrency: "RUB",
            price: record.basePriceRub,
            availability: "https://schema.org/InStock",
            url: absoluteUrl(`/catalog/${canonicalSlug}`),
          },
        };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
      />
      <CatalogProductPageView product={product} record={record} />
    </>
  );
}

export function generateStaticParams() {
  return [];
}
