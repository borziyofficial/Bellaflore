import type { Metadata } from "next";
import "./globals.css";
import {
  absoluteUrl,
  homepageDescription,
  homepageKeywords,
  homepageTitle,
  metadataBase,
  primaryImageUrl,
  siteUrl,
} from "./seo";

export const metadata: Metadata = {
  metadataBase,
  title: homepageTitle,
  description: homepageDescription,
  keywords: homepageKeywords,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: homepageTitle,
    description: homepageDescription,
    type: "website",
    locale: "ru_RU",
    siteName: "Bellaflore",
    url: "/",
    images: [
      {
        url: primaryImageUrl,
        width: 1086,
        height: 1448,
        alt: "Bellaflore — премиальные букеты с доставкой по Москве",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: homepageTitle,
    description: homepageDescription,
    images: [primaryImageUrl],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Bellaflore",
      url: siteUrl,
      logo: primaryImageUrl,
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "Bellaflore",
      url: siteUrl,
      description: homepageDescription,
      inLanguage: "ru-RU",
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
    },
    {
      "@type": "Florist",
      "@id": `${siteUrl}/#florist`,
      name: "Bellaflore",
      url: siteUrl,
      image: primaryImageUrl,
      description: homepageDescription,
      priceRange: "₽₽₽",
      areaServed: {
        "@type": "City",
        name: "Москва",
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Москва",
        addressCountry: "RU",
      },
      sameAs: [absoluteUrl("/")],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
