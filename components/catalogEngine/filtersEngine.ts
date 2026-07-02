// ==================================================
// SECTION: CATALOG ENGINE
// РАЗДЕЛ: Filters Engine
//
// Purpose (EN): Admin-ready filter definitions and product filtering.
//
// Назначение (RU): Определения фильтров и фильтрация товаров.
// ==================================================
import type {
  CatalogFilterDefinition,
  CatalogFilterKind,
  CatalogFilterState,
  CatalogProductRecord,
} from "@/components/catalogEngine/catalogTypes";

export const CATALOG_FILTER_DEFINITIONS: CatalogFilterDefinition[] = [
  {
    kind: "price",
    label: "Цена",
    multiSelect: false,
    options: [
      { id: "price-under-15000", kind: "price", label: "До 15 000 ₽", value: "under-15000" },
      { id: "price-15000-25000", kind: "price", label: "15 000 – 25 000 ₽", value: "mid-range" },
      { id: "price-over-25000", kind: "price", label: "От 25 000 ₽", value: "over-25000" },
    ],
  },
  {
    kind: "size",
    label: "Размер",
    multiSelect: true,
    options: ["S", "M", "L", "XL"].map((size) => ({
      id: `size-${size}`,
      kind: "size" as CatalogFilterKind,
      label: size,
      value: size,
    })),
  },
  {
    kind: "color",
    label: "Цвет",
    multiSelect: true,
    options: [
      { id: "color-red", kind: "color", label: "Красный", value: "red", queryToken: "красн" },
      { id: "color-white", kind: "color", label: "Белый", value: "white", queryToken: "бел" },
      { id: "color-pink", kind: "color", label: "Розовый", value: "pink", queryToken: "розов" },
      { id: "color-soft", kind: "color", label: "Нежный", value: "soft", queryToken: "нежн" },
    ],
  },
  {
    kind: "flower",
    label: "Цветок",
    multiSelect: true,
    options: [
      { id: "flower-roses", kind: "flower", label: "Розы", value: "roses", queryToken: "роз" },
      { id: "flower-peonies", kind: "flower", label: "Пионы", value: "peonies", queryToken: "пион" },
      { id: "flower-hydrangeas", kind: "flower", label: "Гортензии", value: "hydrangeas", queryToken: "гортенз" },
      { id: "flower-mix", kind: "flower", label: "Микс", value: "mix", queryToken: "микс" },
    ],
  },
  {
    kind: "occasion",
    label: "Повод",
    multiSelect: true,
    options: [
      { id: "occasion-birthday", kind: "occasion", label: "День рождения", value: "birthday" },
      { id: "occasion-romantic", kind: "occasion", label: "Любимой", value: "romantic" },
      { id: "occasion-for-mom", kind: "occasion", label: "Маме", value: "for_mom" },
    ],
  },
  {
    kind: "season",
    label: "Сезон",
    multiSelect: true,
    options: [
      { id: "season-all", kind: "season", label: "Круглый год", value: "all-season" },
      { id: "season-spring", kind: "season", label: "Весна", value: "spring" },
      { id: "season-summer", kind: "season", label: "Лето", value: "summer" },
    ],
  },
  {
    kind: "popular",
    label: "Популярные",
    multiSelect: false,
    options: [
      { id: "popular-yes", kind: "popular", label: "Популярные", value: true },
    ],
  },
  {
    kind: "new",
    label: "Новинки",
    multiSelect: false,
    options: [{ id: "new-yes", kind: "new", label: "Новинки", value: true }],
  },
];

function asStringArray(value: string | string[] | number | boolean | undefined): string[] {
  if (value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(String);
  }

  return [String(value)];
}

function matchesPriceFilter(
  product: CatalogProductRecord,
  value: string | string[] | number | boolean | undefined,
): boolean {
  const price = product.basePriceRub;
  const selected = String(value);

  switch (selected) {
    case "under-15000":
      return price <= 15000;
    case "mid-range":
      return price >= 15000 && price <= 25000;
    case "over-25000":
      return price >= 25000;
    default:
      return true;
  }
}

export function applyCatalogFilters(
  products: CatalogProductRecord[],
  filters: CatalogFilterState = {},
): CatalogProductRecord[] {
  return products.filter((product) => {
    if (filters.price !== undefined && !matchesPriceFilter(product, filters.price)) {
      return false;
    }

    const sizeFilters = asStringArray(filters.size);
    if (
      sizeFilters.length > 0 &&
      !sizeFilters.some((sizeId) =>
        product.sizes.some(
          (size) => size.sizeId === sizeId && size.isActive,
        ),
      )
    ) {
      return false;
    }

    const colorFilters = asStringArray(filters.color);
    if (
      colorFilters.length > 0 &&
      !colorFilters.some((color) => product.colors.includes(color))
    ) {
      return false;
    }

    const flowerFilters = asStringArray(filters.flower);
    if (
      flowerFilters.length > 0 &&
      !flowerFilters.some((flower) =>
        product.flowerTypes.some((type) =>
          type.toLowerCase().includes(flower.replace("s", "")),
        ),
      )
    ) {
      return false;
    }

    const occasionFilters = asStringArray(filters.occasion);
    if (
      occasionFilters.length > 0 &&
      !occasionFilters.some((occasion) => product.occasions.includes(occasion))
    ) {
      return false;
    }

    const seasonFilters = asStringArray(filters.season);
    if (
      seasonFilters.length > 0 &&
      !seasonFilters.some((season) => product.seasons.includes(season))
    ) {
      return false;
    }

    if (filters.popular === true && product.popularityScore < 75) {
      return false;
    }

    if (filters.new === true && !product.isNew) {
      return false;
    }

    return true;
  });
}

export function getCatalogFilterDefinitions(): CatalogFilterDefinition[] {
  return CATALOG_FILTER_DEFINITIONS;
}

export function filtersToSearchTokens(
  filters: CatalogFilterState,
): string[] {
  const tokens: string[] = [];

  for (const definition of CATALOG_FILTER_DEFINITIONS) {
    const rawValue = filters[definition.kind];
    if (rawValue === undefined) {
      continue;
    }

    const selectedValues = asStringArray(rawValue);
    for (const value of selectedValues) {
      const option = definition.options.find(
        (item) => String(item.value) === value || item.id.endsWith(String(value)),
      );
      if (option?.queryToken) {
        tokens.push(option.queryToken);
      }
    }
  }

  return tokens;
}
