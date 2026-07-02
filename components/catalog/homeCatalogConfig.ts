// ==================================================
// SECTION: HOME CATALOG
// РАЗДЕЛ: Каталог на главной — hero chips
// ==================================================

export type HomeCatalogCategoryChip = {
  id: string;
  label: string;
};

export const homeCatalogCategoryChips: HomeCatalogCategoryChip[] = [
  { id: "roses", label: "Розы" },
  { id: "peonies", label: "Пионы" },
  { id: "hydrangeas", label: "Гортензии" },
  { id: "baskets", label: "Корзины" },
  { id: "boxes", label: "Коробки" },
];

export const homeCatalogSearchPlaceholder = "Найти букет или цветы…";
