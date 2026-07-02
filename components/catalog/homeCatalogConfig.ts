// ==================================================
// SECTION: HOME CATALOG
// РАЗДЕЛ: Каталог на главной — chips (Stage 57A)
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
  { id: "baskets", label: "Корзины" },
  { id: "boxes", label: "Коробки" },
  { id: "new", label: "Новинки" },
];

export const homeCatalogSearchPlaceholder = "Найти букет или цветы…";

export const homeCatalogTitle = "Выберите букет";
export const homeCatalogSubtitle = "Свежие букеты с доставкой сегодня";
