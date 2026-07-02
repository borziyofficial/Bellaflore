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
  { id: "peonies", label: "Пионы" },
  { id: "roses", label: "Розы" },
  { id: "hydrangeas", label: "Гортензии" },
  { id: "baskets", label: "Корзины" },
  { id: "boxes", label: "Коробки" },
  { id: "author", label: "Авторские" },
  { id: "new", label: "Новинки" },
];

export const homeCatalogSearchPlaceholder = "Найти букет или цветы…";

export const homeCatalogTitle = "Каталог";
