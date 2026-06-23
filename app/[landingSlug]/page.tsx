import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getSeoLandingPage,
  metadataBase,
  primaryImageUrl,
  seoLandingPages,
} from "../seo";
import styles from "./page.module.css";

type SeoLandingPageProps = {
  params: Promise<{
    landingSlug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return seoLandingPages.map((page) => ({
    landingSlug: page.slug,
  }));
}

export async function generateMetadata({
  params,
}: SeoLandingPageProps): Promise<Metadata> {
  const { landingSlug } = await params;
  const page = getSeoLandingPage(landingSlug);

  if (!page) {
    return {};
  }

  return {
    metadataBase,
    title: page.title,
    description: page.description,
    alternates: {
      canonical: `/${page.slug}`,
    },
    openGraph: {
      title: page.title,
      description: page.description,
      type: "website",
      locale: "ru_RU",
      siteName: "Bellaflore",
      url: `/${page.slug}`,
      images: [
        {
          url: primaryImageUrl,
          width: 1086,
          height: 1448,
          alt: page.h1,
        },
      ],
    },
  };
}

export default async function SeoLandingPage({ params }: SeoLandingPageProps) {
  const { landingSlug } = await params;
  const page = getSeoLandingPage(landingSlug);

  if (!page) {
    notFound();
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="seo-page-title">
        <p className={styles.eyebrow}>Bellaflore</p>
        <h1 id="seo-page-title">{page.h1}</h1>
        <p className={styles.intro}>{page.intro}</p>
      </section>
    </main>
  );
}
