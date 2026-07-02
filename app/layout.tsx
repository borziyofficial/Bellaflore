// ==================================================
// SECTION: SEO & Root Layout Metadata
// РАЗДЕЛ: SEO и метаданные корневого layout
//
// Purpose (EN): Root HTML shell, global CSS imports, site metadata, Open Graph, Twitter cards, and JSON-LD structured data.
//
// Назначение (RU): Корневой HTML-контейнер, импорт глобальных стилей, метаданные сайта, Open Graph, Twitter-карточки и JSON-LD разметка.
// ==================================================

import type { Metadata } from "next";
import "./globals.css";
import "./pearl-theme.css";
import "./pearl-typography.css";
import "./pearl-buttons.css";
import "./pearl-inputs.css";
import "./pearl-surfaces.css";
import "./pearl-motion.css";
import "./pearl-readability.css";
import "./pearl-mobile-qa.css";
import "./bellaflore-ui-system.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
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
    <html lang="ru" suppressHydrationWarning data-theme="day">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem("bellaflore-ui-theme-manual");if(m==="day"||m==="night"){document.documentElement.dataset.theme=m;return;}var h=Number(new Intl.DateTimeFormat("en-US",{hour:"numeric",hour12:false,timeZone:"Europe/Moscow"}).format(new Date()));var t=h>=7&&h<20?"day":"night";document.documentElement.dataset.theme=t;localStorage.setItem("bellaflore-ui-theme",t);}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
