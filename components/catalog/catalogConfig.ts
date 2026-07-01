// ==================================================
// SECTION: CATALOG
// РАЗДЕЛ: Каталог
//
// Purpose (EN):
// Catalog menu, quantities, premium groups, and bouquet registry config.
//
// Назначение (RU):
// Конфигурация меню каталога, количеств, премиум-групп и реестра букетов.
// ==================================================
export type CatalogConfigItem = {
  id: string;
  label: string;
  query: string;
  enabled: boolean;
  seasonal: boolean;
  sortOrder: number;
  icon?: string;
  dividerBefore?: boolean;
};


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN):
// Exported type and interface definitions.
//
// Назначение (RU):
// Экспортируемые типы и интерфейсы.
// ==================================================
export type CatalogMenuItem = CatalogConfigItem & {
  children?: CatalogConfigItem[];
};

const catalogItem = (
  id: string,
  label: string,
  query = label,
  options?: Partial<
    Pick<
      CatalogConfigItem,
      "enabled" | "seasonal" | "sortOrder" | "icon" | "dividerBefore"
    >
  >,
): CatalogConfigItem => ({
  id,
  label,
  query,
  enabled: options?.enabled ?? true,
  seasonal: options?.seasonal ?? false,
  sortOrder: options?.sortOrder ?? 0,
  icon: options?.icon,
  dividerBefore: options?.dividerBefore,
});

const menuItem = (
  id: string,
  label: string,
  query = label,
  options?: Partial<
    Pick<
      CatalogConfigItem,
      "enabled" | "seasonal" | "sortOrder" | "icon" | "dividerBefore"
    >
  > & {
    children?: CatalogConfigItem[];
  },
): CatalogMenuItem => ({
  ...catalogItem(id, label, query, options),
  children: options?.children,
});

/** Official BellaFlore Premium Catalog — admin-ready accordion menu */
export const catalogPremiumMenu: CatalogMenuItem[] = [
  menuItem("all-flowers", "Все цветы", "букет", {
    sortOrder: 1,
    icon: "🌹",
  }),
  menuItem("roses", "Розы", "розы", {
    sortOrder: 2,
    icon: "🌹",
    children: [
      catalogItem("roses-single", "Одноголовые", "одноголовые розы", {
        sortOrder: 1,
      }),
      catalogItem("roses-spray", "Кустовые", "кустовые розы", { sortOrder: 2 }),
      catalogItem("roses-peony", "Пионовидные", "пионовидные розы", {
        sortOrder: 3,
      }),
      catalogItem("roses-garden", "Garden Roses", "garden roses", {
        sortOrder: 4,
      }),
      catalogItem("roses-premium", "Premium Roses", "premium roses", {
        sortOrder: 5,
      }),
    ],
  }),
  menuItem("peonies", "Пионы", "пионы", { sortOrder: 3, icon: "🌸" }),
  menuItem("tulips", "Тюльпаны", "тюльпаны", { sortOrder: 4, icon: "🌷" }),
  menuItem("hydrangeas", "Гортензии", "гортензия", {
    sortOrder: 5,
    icon: "💙",
  }),
  menuItem("eustoma", "Эустомы", "эустома", { sortOrder: 6, icon: "🤍" }),
  menuItem("daisies", "Ромашки", "ромашки", { sortOrder: 7, icon: "🌼" }),
  menuItem("lilies", "Лилии", "лилии", { sortOrder: 8, icon: "🌺" }),
  menuItem("callas", "Каллы", "каллы", { sortOrder: 9, icon: "🌿" }),
  menuItem("chrysanthemums", "Хризантемы", "хризантемы", {
    sortOrder: 10,
    icon: "🌼",
  }),
  menuItem("carnations", "Гвоздики", "гвоздики", { sortOrder: 11, icon: "🌹" }),
  menuItem("orchids", "Орхидеи", "орхидеи", { sortOrder: 12, icon: "🌺" }),
  menuItem("alstroemeria", "Альстромерии", "альстромерия", {
    sortOrder: 13,
    icon: "🌼",
  }),
  menuItem("mattiola", "Маттиола", "маттиола", { sortOrder: 14, icon: "🌸" }),
  menuItem("lily-of-valley", "Ландыши", "ландыши", {
    sortOrder: 15,
    icon: "🌸",
  }),

  menuItem("bouquets", "Букеты", "букет", {
    sortOrder: 20,
    icon: "💐",
    dividerBefore: true,
    children: [
      catalogItem("bouquets-mono", "Монобукеты", "монобукет", { sortOrder: 1 }),
      catalogItem("bouquets-mix", "Микс-букеты", "микс букет", { sortOrder: 2 }),
      catalogItem("bouquets-author", "Авторские", "авторский букет", {
        sortOrder: 3,
      }),
      catalogItem("bouquets-premium", "Premium Collection", "premium collection", {
        sortOrder: 4,
      }),
      catalogItem("bouquets-luxury", "Luxury Collection", "luxury collection", {
        sortOrder: 5,
      }),
    ],
  }),
  menuItem("boxes", "Коробки", "коробка", {
    sortOrder: 21,
    icon: "🎁",
    dividerBefore: true,
  }),
  menuItem("baskets", "Корзины", "корзина", {
    sortOrder: 22,
    icon: "🧺",
    dividerBefore: true,
  }),
  menuItem("compositions", "Композиции", "композиция", {
    sortOrder: 23,
    icon: "✨",
    dividerBefore: true,
  }),
  menuItem("vip", "VIP", "vip", { sortOrder: 24, icon: "👑", dividerBefore: true }),
  menuItem("wedding-collection", "Свадебная коллекция", "свадебная коллекция", {
    sortOrder: 25,
    icon: "💍",
    dividerBefore: true,
  }),

  menuItem("occasions", "Поводы", "повод", {
    sortOrder: 30,
    icon: "🎀",
    dividerBefore: true,
    children: [
      catalogItem("occasion-birthday", "День рождения", "день рождения", {
        sortOrder: 1,
      }),
      catalogItem("occasion-beloved", "Любимой", "любимой", { sortOrder: 2 }),
      catalogItem("occasion-mom", "Маме", "маме", { sortOrder: 3 }),
      catalogItem("occasion-thanks", "Благодарность", "благодарность", {
        sortOrder: 4,
      }),
      catalogItem("occasion-sorry", "Извинения", "извинения", { sortOrder: 5 }),
      catalogItem("occasion-newborn", "Новорождённому", "новорождённому", {
        sortOrder: 6,
      }),
      catalogItem("occasion-jubilee", "Юбилей", "юбилей", { sortOrder: 7 }),
      catalogItem("occasion-graduation", "Выпускной", "выпускной", {
        sortOrder: 8,
      }),
      catalogItem("occasion-wedding", "Свадьба", "свадьба", { sortOrder: 9 }),
    ],
  }),
  menuItem("holidays", "Праздники", "праздник", {
    sortOrder: 31,
    icon: "🎉",
    dividerBefore: true,
    children: [
      catalogItem("holiday-march8", "8 Марта", "8 марта", {
        sortOrder: 1,
        seasonal: true,
      }),
      catalogItem("holiday-valentine", "День святого Валентина", "валентин", {
        sortOrder: 2,
        seasonal: true,
      }),
      catalogItem("holiday-mothers", "День матери", "день матери", {
        sortOrder: 3,
        seasonal: true,
      }),
      catalogItem("holiday-sept1", "1 сентября", "1 сентября", {
        sortOrder: 4,
        seasonal: true,
      }),
      catalogItem("holiday-newyear", "Новый год", "новый год", {
        sortOrder: 5,
        seasonal: true,
      }),
      catalogItem("holiday-lastbell", "Последний звонок", "последний звонок", {
        sortOrder: 6,
        seasonal: true,
      }),
    ],
  }),
];

/** @deprecated Use catalogPremiumMenu */

// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN):
// Public exported functions and constants.
//
// Назначение (RU):
// Публичные экспортируемые функции и константы.
// ==================================================
export const catalogMainMenu = catalogPremiumMenu;

export const catalogQuantities: CatalogConfigItem[] = [
  9, 11, 13, 15, 19, 29, 33, 51, 77, 101, 151, 201, 301, 501, 1001,
].map((value, index) =>
  catalogItem(`qty-${value}`, String(value), `${value} роз`, {
    sortOrder: index + 1,
  }),
);

export const catalogCollections: CatalogConfigItem[] = [
  catalogItem("luxury-collection", "Luxury Collection", "luxury", {
    sortOrder: 1,
  }),
  catalogItem("white-collection", "White Collection", "white collection", {
    sortOrder: 2,
  }),
  catalogItem("red-collection", "Red Collection", "red luxury", { sortOrder: 3 }),
  catalogItem("pink-collection", "Pink Collection", "pink elegance", {
    sortOrder: 4,
  }),
  catalogItem("gift-collection", "Gift Collection", "подарок", { sortOrder: 5 }),
  catalogItem("signature-bellaflore", "Signature Bellaflore", "bellaflore", {
    sortOrder: 6,
  }),
  catalogItem("seasonal-collection", "Seasonal Collection", "сезонные", {
    sortOrder: 7,
    seasonal: true,
  }),
];

export function getVisibleCatalogItems(items: CatalogConfigItem[]) {
  return items
    .filter((item) => item.enabled)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function getVisibleCatalogMenu(items: CatalogMenuItem[]) {
  return items
    .filter((item) => item.enabled)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) => ({
      ...item,
      children: item.children ? getVisibleCatalogItems(item.children) : undefined,
    }));
}

export const catalogSearchPlaceholder =
  "Поиск роз, пионов, букетов...";

export type CatalogFilterChip = {
  id: string;
  label: string;
  query: string;
};

export const catalogFilterChips: CatalogFilterChip[] = [
  { id: "all", label: "Все", query: "" },
  { id: "roses", label: "Розы", query: "розы" },
  { id: "peonies", label: "Пионы", query: "пионы" },
  { id: "hydrangeas", label: "Гортензии", query: "гортензия" },
  { id: "baskets", label: "Корзины", query: "корзины" },
  { id: "boxes", label: "Коробки", query: "коробки" },
  { id: "tulips", label: "Тюльпаны", query: "тюльпаны" },
  { id: "author", label: "Авторские", query: "авторские" },
];

/** Optional display badges for existing catalog products — UI only */
export const catalogProductBadges: Record<string, string> = {
  "white-pearl": "Хит",
  "pink-elegance": "Новинка",
  "royal-collection": "Сезон",
};
