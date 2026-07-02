// ==================================================
// SECTION: CATALOG ENGINE
// РАЗДЕЛ: SEO Engine
//
// Purpose (EN): Product SEO bundle — title, description, slug, schema, OpenGraph.
//
// Назначение (RU): SEO-пакет товара — title, description, slug, schema, OpenGraph.
// ==================================================
import type { CatalogProductSeo } from "@/components/catalogEngine/catalogTypes";

type BuildProductSeoInput = {
  title: string;
  shortDescription: string;
  fullDescription: string;
  slug: string;
  primaryImageUrl: string;
  basePriceRub: number;
};

export function buildProductSeoBundle(
  input: BuildProductSeoInput,
): CatalogProductSeo {
  const seoTitle = `${input.title} — купить с доставкой | Bellaflore`;
  const seoDescription =
    input.fullDescription.trim() ||
    `${input.shortDescription}. Премиальная доставка цветов Bellaflore по Москве.`;
  const canonicalPath = `/catalog/${input.slug}`;

  return {
    title: seoTitle,
    description: seoDescription,
    slug: input.slug,
    canonicalPath,
    schemaType: "Product",
    schemaJsonLd: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: input.title,
      description: seoDescription,
      image: input.primaryImageUrl,
      brand: {
        "@type": "Brand",
        name: "Bellaflore",
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "RUB",
        price: input.basePriceRub,
        availability: "https://schema.org/InStock",
        url: canonicalPath,
      },
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      imageUrl: input.primaryImageUrl,
      type: "product",
      locale: "ru_RU",
    },
  };
}

export function buildOpenGraphMetaTags(seo: CatalogProductSeo): Record<string, string> {
  return {
    "og:title": seo.openGraph.title,
    "og:description": seo.openGraph.description,
    "og:image": seo.openGraph.imageUrl,
    "og:type": seo.openGraph.type,
    "og:locale": seo.openGraph.locale,
  };
}
