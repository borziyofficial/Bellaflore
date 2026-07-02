// ==================================================
// SECTION: CATALOG ENGINE
// РАЗДЕЛ: Categories Catalog
//
// Purpose (EN): Separate admin-ready category source of truth.
//
// Назначение (RU): Отдельный каталог категорий для админки.
// ==================================================
import type { CatalogCategoryRecord } from "@/components/catalogEngine/catalogTypes";

function buildCategory(
  partial: Omit<CatalogCategoryRecord, "seo"> & {
    seoDescription?: string;
  },
): CatalogCategoryRecord {
  return {
    ...partial,
    seo: {
      title: `${partial.title} — Bellaflore`,
      description:
        partial.seoDescription ??
        `Премиальные ${partial.title.toLowerCase()} с доставкой по Москве.`,
      slug: partial.slug,
    },
  };
}

/** Primary storefront categories — admin CRUD ready. */
export const CATALOG_CATEGORIES: CatalogCategoryRecord[] = [
  buildCategory({
    id: "roses",
    slug: "rozy",
    title: "Розы",
    description: "Моно- и авторские букеты из премиальных роз.",
    parentId: null,
    sortOrder: 1,
    isActive: true,
    isSeasonal: false,
    icon: "🌹",
  }),
  buildCategory({
    id: "peonies",
    slug: "piony",
    title: "Пионы",
    description: "Сезонные и авторские композиции с пионами.",
    parentId: null,
    sortOrder: 2,
    isActive: true,
    isSeasonal: true,
    icon: "🌸",
  }),
  buildCategory({
    id: "hydrangeas",
    slug: "gortenzii",
    title: "Гортензии",
    description: "Объёмные букеты и композиции с гортензиями.",
    parentId: null,
    sortOrder: 3,
    isActive: true,
    isSeasonal: false,
    icon: "💙",
  }),
  buildCategory({
    id: "mono-bouquets",
    slug: "monobukety",
    title: "Монобукеты",
    description: "Букеты из одного вида цветов в премиальной подаче.",
    parentId: null,
    sortOrder: 4,
    isActive: true,
    isSeasonal: false,
    icon: "💐",
  }),
  buildCategory({
    id: "author",
    slug: "avtorskie",
    title: "Авторские",
    description: "Авторские композиции Bellaflore.",
    parentId: null,
    sortOrder: 5,
    isActive: true,
    isSeasonal: false,
    icon: "✨",
  }),
  buildCategory({
    id: "boxes",
    slug: "korobki",
    title: "Коробки",
    description: "Цветы в фирменных коробках Bellaflore.",
    parentId: null,
    sortOrder: 6,
    isActive: true,
    isSeasonal: false,
    icon: "🎁",
  }),
  buildCategory({
    id: "baskets",
    slug: "korziny",
    title: "Корзины",
    description: "Премиальные цветочные корзины.",
    parentId: null,
    sortOrder: 7,
    isActive: true,
    isSeasonal: false,
    icon: "🧺",
  }),
  buildCategory({
    id: "vip",
    slug: "vip",
    title: "VIP",
    description: "Эксклюзивные VIP-композиции.",
    parentId: null,
    sortOrder: 8,
    isActive: true,
    isSeasonal: false,
    icon: "👑",
  }),
  buildCategory({
    id: "new",
    slug: "novinki",
    title: "Новинки",
    description: "Новые поступления Bellaflore.",
    parentId: null,
    sortOrder: 9,
    isActive: true,
    isSeasonal: false,
    icon: "🆕",
  }),
];

export const CATALOG_CATEGORY_BY_ID = Object.fromEntries(
  CATALOG_CATEGORIES.map((category) => [category.id, category]),
) as Record<string, CatalogCategoryRecord>;

export const CATALOG_CATEGORY_BY_SLUG = Object.fromEntries(
  CATALOG_CATEGORIES.map((category) => [category.slug, category]),
) as Record<string, CatalogCategoryRecord>;
