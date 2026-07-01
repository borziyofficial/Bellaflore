// ==================================================
// SECTION: HOME CATALOG
// РАЗДЕЛ: Каталог на главной
//
// Purpose (EN): Homepage category chips and quick filters for Stage 50 catalog UX.
//
// Назначение (RU): Чипы категорий и быстрые фильтры каталога на главной.
// ==================================================

export type HomeCatalogCategoryChip = {
  id: string;
  label: string;
};

export type HomeCatalogQuickFilter = {
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
  { id: "tulips", label: "Тюльпаны" },
  { id: "author", label: "Авторские" },
];

export const homeCatalogQuickFilters: HomeCatalogQuickFilter[] = [
  { id: "popular", label: "Популярные" },
  { id: "under-5000", label: "До 5 000 ₽" },
  { id: "mid-range", label: "5 000–10 000 ₽" },
  { id: "premium", label: "Премиум" },
  { id: "today", label: "Сегодня" },
];

export const homeCatalogSearchPlaceholder = "Найти букет, цветы или повод…";
