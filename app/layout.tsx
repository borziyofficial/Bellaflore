// ==================================================
// SECTION: SEO & Root Layout Metadata
// РАЗДЕЛ: SEO и метаданные корневого layout
//
// Purpose (EN): Root HTML shell, global CSS imports, site metadata, Open Graph, Twitter cards, and JSON-LD structured data.
//
// Назначение (RU): Корневой HTML-контейнер, импорт глобальных стилей, метаданные сайта, Open Graph, Twitter-карточки и JSON-LD разметка.
// ==================================================

import type { Metadata } from "next";
import { headers } from "next/headers";
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
import "./dark-luxury-theme.css";
import "./dark-luxury-overrides.css";
import "./admin-theme-guard.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { inter, playfairDisplay } from "@/lib/fonts";
import { resolveThemeForPathname } from "@/lib/theme/bellafloreAutoTheme";
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

const themeInitScript = `(function(){try{var p=location.pathname;var t=/^\\/admin(?:\\/|$)/.test(p)?"day":"dark-luxury";document.documentElement.dataset.theme=t;localStorage.setItem("bellaflore-ui-theme",t);localStorage.removeItem("bellaflore-ui-theme-manual");}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pathname") ?? "";
  const initialTheme = resolveThemeForPathname(pathname);

  return (
    <html
      lang="ru"
      suppressHydrationWarning
      data-theme={initialTheme}
      className={`${playfairDisplay.variable} ${inter.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
