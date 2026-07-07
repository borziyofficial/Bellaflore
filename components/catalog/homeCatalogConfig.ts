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
  { id: "boxes", label: "Коробки" },
  { id: "baskets", label: "Корзины" },
  { id: "compositions", label: "Композиции" },
  { id: "author", label: "Авторские" },
  { id: "new", label: "Новинки" },
];

export const homeCatalogSearchPlaceholder = "Найти букет или цветы…";

export const homeCatalogTitle = "Каталог";
