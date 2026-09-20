// ==================================================
// SECTION: Home Page Server Wrapper
// РАЗДЕЛ: Серверная обертка главной страницы
//
// Purpose (EN): Server-side data layer wrapper that loads published catalog directly
// from database and passes it to client component for SSR with real product data.
// No self-fetch, direct database access for production source of truth.
//
// Назначение (RU): Серверная обертка, загружающая опубликованный каталог напрямую
// из БД и передающая его клиентскому компоненту для SSR с реальными товарами.
// Без self-fetch, прямой доступ к БД для production.
// ==================================================

import { loadPublishedStorefrontCatalog } from "@/lib/catalogDb/publicStorefront";
import { mergePublicStorefrontCatalog } from "@/components/catalog/publicCatalogMerge";
import HomePageClient from "./page-client";

export const metadata = {
  title: "BellaFlore — Премиум букеты с доставкой в Москве",
  description: "Свежие цветы, авторские композиции и AI-консультант. Доставка в Москву и МО.",
};

export default async function HomePage(): Promise<React.ReactNode> {
  const catalogResult = await loadPublishedStorefrontCatalog();

  const initialProducts =
    catalogResult.status === "success" ? catalogResult.products : [];

  // In production, if catalog fails to load, show error state to client
  // Do NOT silently fall back to empty array or seed data
  const initialStatus =
    catalogResult.status === "success" ? "ready" : ("error" as const);

  if (catalogResult.status !== "success" && catalogResult.status !== "error") {
    // Unconfigured case (should only happen in development)
    console.warn(
      "[HOME_PAGE] Catalog not configured:",
      catalogResult.error,
    );
  }

  if (catalogResult.status === "error") {
    console.error(
      "[HOME_PAGE] Failed to load catalog from database:",
      catalogResult.error,
    );
  }

  // Merge any additional computed catalog data (if needed by client)
  const mergedCatalog = initialProducts.length > 0
    ? mergePublicStorefrontCatalog(initialProducts)
    : [];

  return (
    <HomePageClient
      initialProducts={mergedCatalog}
      initialStatus={initialStatus}
    />
  );
}
