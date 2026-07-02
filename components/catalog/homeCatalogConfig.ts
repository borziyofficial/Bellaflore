// ==================================================
// SECTION: HOME CATALOG
// РАЗДЕЛ: Каталог на главной — Pearl Luxury v2 (Stage 58)
// ==================================================

export type HomeCatalogCategoryChip = {
  id: string;
  label: string;
};

export const homeCatalogCategoryChips: HomeCatalogCategoryChip[] = [
  { id: "all", label: "Все" },
  { id: "roses", label: "Розы" },
  { id: "peonies", label: "Пионы" },
  { id: "hydrangeas", label: "Гортензии" },
  { id: "author", label: "Авторские" },
  { id: "baskets", label: "Корзины" },
  { id: "boxes", label: "Коробки" },
];

export const homeCatalogSearchPlaceholder = "Найти букет или цветы…";

export const homeCatalogTitle = "Выберите букет";
export const homeCatalogSubtitleLine1 = "Самые красивые композиции";
export const homeCatalogSubtitleLine2 = "с доставкой сегодня";
