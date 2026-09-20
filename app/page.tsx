// ==================================================
// SECTION: Home Page Server Wrapper
// РАЗДЕЛ: Серверная обертка главной страницы
//
// Purpose (EN): Server-side data fetching wrapper that initializes the catalog
// and passes it to the client-side Home component for SSR with real product data.
//
// Назначение (RU): Серверная обертка для загрузки данных каталога,
// которая передает их клиентскому компоненту для SSR с реальными товарами.
// ==================================================

import type { CatalogProduct } from "@/data/catalogProducts";
import { fetchPublishedStorefrontProducts } from "@/components/adminCatalogManager/catalogApiClient";
import { mergePublicStorefrontCatalog } from "@/components/catalog/publicCatalogMerge";
import HomePageClient from "./page-client";

async function fetchInitialCatalog(): Promise<CatalogProduct[]> {
  try {
    const publishedProducts = await fetchPublishedStorefrontProducts();
    const mergedCatalog = mergePublicStorefrontCatalog(publishedProducts);
    return mergedCatalog;
  } catch (error) {
    console.error("[HOME_PAGE] Failed to fetch initial catalog for SSR:", error);
    return [];
  }
}

export const metadata = {
  title: "BellaFlore — Премиум букеты с доставкой в Москве",
  description: "Свежие цветы, авторские композиции и AI-консультант. Доставка в Москву и МО.",
};

export default async function HomePage() {
  const initialProducts = await fetchInitialCatalog();

  return <HomePageClient initialProducts={initialProducts} />;
}
