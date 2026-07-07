// ==================================================
// SECTION: ADMIN APP — Bouquet list helpers (Stage 2.5)
// ==================================================
import { getEnabledBouquetSizeCodes } from "@/components/adminApp/modules/bouquets/bouquetSizeUtils";
import type {
  BouquetBadge,
  BouquetDisplayFlags,
  BouquetRecord,
  BouquetStatus,
} from "@/components/adminApp/modules/bouquets/bouquetTypes";
import {
  BOUQUET_BADGE_LABELS,
  BOUQUET_STATUS_LABELS,
} from "@/components/adminApp/modules/bouquets/bouquetTypes";

export type BouquetBadgeFilter = "all" | BouquetBadge | "no_badge";

export type BouquetDisplayFilter =
  | "all"
  | "showOnHomepage"
  | "showInCatalog"
  | "isRecommended"
  | "isSeasonal";

export type BouquetSortOption =
  | "default"
  | "priority"
  | "newest"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "name_desc";

export type BouquetListFilters = {
  search: string;
  status: "all" | BouquetStatus;
  category: string;
  badge: BouquetBadgeFilter;
  display: BouquetDisplayFilter;
  sort: BouquetSortOption;
};

export const DEFAULT_BOUQUET_LIST_FILTERS: BouquetListFilters = {
  search: "",
  status: "all",
  category: "all",
  badge: "all",
  display: "all",
  sort: "default",
};

export const BOUQUET_STATUS_FILTER_OPTIONS: Array<{
  value: "all" | BouquetStatus;
  label: string;
}> = [
  { value: "all", label: "Все" },
  { value: "active", label: BOUQUET_STATUS_LABELS.active },
  { value: "hidden", label: BOUQUET_STATUS_LABELS.hidden },
  { value: "out_of_stock", label: BOUQUET_STATUS_LABELS.out_of_stock },
  { value: "coming_soon", label: "Скоро будет" },
  { value: "draft", label: BOUQUET_STATUS_LABELS.draft },
];

export const BOUQUET_BADGE_FILTER_OPTIONS: Array<{
  value: BouquetBadgeFilter;
  label: string;
}> = [
  { value: "all", label: "Все" },
  { value: "new", label: "Новинка" },
  { value: "hit", label: "Хит" },
  { value: "premium", label: "Премиум" },
  { value: "sale", label: "Скидка" },
  { value: "limited", label: "Лимит" },
  { value: "no_badge", label: "Без бейджа" },
];

export const BOUQUET_DISPLAY_FILTER_OPTIONS: Array<{
  value: BouquetDisplayFilter;
  label: string;
}> = [
  { value: "all", label: "Все" },
  { value: "showOnHomepage", label: "На главной" },
  { value: "showInCatalog", label: "В каталоге" },
  { value: "isRecommended", label: "Рекомендуемые" },
  { value: "isSeasonal", label: "Сезонные" },
];

export const BOUQUET_SORT_OPTIONS: Array<{
  value: BouquetSortOption;
  label: string;
}> = [
  { value: "default", label: "По умолчанию" },
  { value: "priority", label: "По приоритету" },
  { value: "newest", label: "Новые сначала" },
  { value: "oldest", label: "Старые сначала" },
  { value: "price_asc", label: "Цена ↑" },
  { value: "price_desc", label: "Цена ↓" },
  { value: "name_asc", label: "Название А-Я" },
  { value: "name_desc", label: "Название Я-А" },
];

export function hasActiveBouquetListFilters(filters: BouquetListFilters): boolean {
  return (
    filters.search.trim().length > 0 ||
    filters.status !== "all" ||
    filters.category !== "all" ||
    filters.badge !== "all" ||
    filters.display !== "all" ||
    filters.sort !== "default"
  );
}

function matchesBadgeFilter(bouquet: BouquetRecord, badge: BouquetBadgeFilter): boolean {
  if (badge === "all") {
    return true;
  }

  if (badge === "no_badge") {
    return bouquet.badge === "none";
  }

  return bouquet.badge === badge;
}

function matchesDisplayFilter(
  bouquet: BouquetRecord,
  display: BouquetDisplayFilter,
): boolean {
  if (display === "all") {
    return true;
  }

  return Boolean(bouquet.displayFlags?.[display as keyof BouquetDisplayFlags]);
}

export function filterBouquetList(
  bouquets: BouquetRecord[],
  filters: BouquetListFilters,
): BouquetRecord[] {
  const query = filters.search.trim().toLowerCase();

  return bouquets.filter((bouquet) => {
    const matchesSearch =
      !query ||
      bouquet.name.toLowerCase().includes(query) ||
      bouquet.description.toLowerCase().includes(query) ||
      bouquet.slug.toLowerCase().includes(query);

    const matchesCategory =
      filters.category === "all" || bouquet.category === filters.category;

    const matchesStatus =
      filters.status === "all" || bouquet.status === filters.status;

    const matchesBadge = matchesBadgeFilter(bouquet, filters.badge);
    const matchesDisplay = matchesDisplayFilter(bouquet, filters.display);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStatus &&
      matchesBadge &&
      matchesDisplay
    );
  });
}

export function sortBouquetList(
  bouquets: BouquetRecord[],
  sort: BouquetSortOption,
): BouquetRecord[] {
  const items = [...bouquets];

  switch (sort) {
    case "priority":
      return items.sort(
        (left, right) =>
          left.displayPriority - right.displayPriority ||
          right.updatedAt.localeCompare(left.updatedAt),
      );
    case "newest":
      return items.sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      );
    case "oldest":
      return items.sort((left, right) =>
        left.createdAt.localeCompare(right.createdAt),
      );
    case "price_asc":
      return items.sort((left, right) => left.basePrice - right.basePrice);
    case "price_desc":
      return items.sort((left, right) => right.basePrice - left.basePrice);
    case "name_asc":
      return items.sort((left, right) =>
        left.name.localeCompare(right.name, "ru"),
      );
    case "name_desc":
      return items.sort((left, right) =>
        right.name.localeCompare(left.name, "ru"),
      );
    case "default":
    default:
      return items.sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt),
      );
  }
}

export function applyBouquetListQuery(
  bouquets: BouquetRecord[],
  filters: BouquetListFilters,
): BouquetRecord[] {
  return sortBouquetList(filterBouquetList(bouquets, filters), filters.sort);
}

export function formatBouquetSizeSummary(bouquet: BouquetRecord): string {
  const enabled = getEnabledBouquetSizeCodes(bouquet.sizes);
  return enabled.length > 0 ? enabled.join(" / ") : "—";
}

export function resolveBouquetVisibilitySummary(bouquet: BouquetRecord): string[] {
  const labels: string[] = [];
  if (bouquet.displayFlags?.showOnHomepage) {
    labels.push("Главная");
  }
  if (bouquet.displayFlags?.showInCatalog) {
    labels.push("Каталог");
  }
  return labels;
}

export function resolveBouquetBadgeLabel(badge: BouquetBadge): string {
  if (badge === "none") {
    return "";
  }
  return BOUQUET_BADGE_LABELS[badge];
}
