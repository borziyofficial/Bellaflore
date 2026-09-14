import { expect, test } from "@playwright/test";
import { filterAdminProducts } from "../../components/adminCatalogManager/adminProductFiltering";
import type { CatalogProductRecord } from "../../components/catalogEngine/catalogTypes";

function product(
  catalogNumber: string,
  title: string,
  options: Partial<CatalogProductRecord> = {},
): CatalogProductRecord {
  return {
    id: catalogNumber,
    slug: title.toLocaleLowerCase("ru-RU").replaceAll(" ", "-"),
    title,
    tags: [],
    categoryIds: ["bouquets"],
    basePriceRub: 5_000,
    availability: "in_stock",
    status: "ACTIVE",
    isPublished: true,
    metadata: {
      catalogVersion: "test",
      catalogNumber,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    ...options,
  } as CatalogProductRecord;
}

const products = [
  product("BF-001", "Белая Маттиола", { basePriceRub: 7_900 }),
  product("BF-009", "Розовое облако", {
    categoryIds: ["roses"],
    availability: "made_to_order",
    basePriceRub: 4_900,
  }),
  product("BF-087", "Воздушная гортензия", {
    status: "DRAFT",
    isPublished: false,
    basePriceRub: 12_900,
  }),
];

const defaults = {
  search: "",
  categoryId: "all",
  status: "all" as const,
  stock: "all",
  sort: "updated-desc" as const,
};

for (const code of ["BF-001", "BF-009", "BF-087"]) {
  test(`exact ${code} search returns only that product`, () => {
    expect(filterAdminProducts(products, { ...defaults, search: code }).map((item) => item.id)).toEqual([
      code,
    ]);
  });
}

test("an exact BF lookup remains immediate while filters are selected", () => {
  expect(
    filterAdminProducts(products, {
      ...defaults,
      search: "bf-001",
      categoryId: "roses",
      status: "draft",
      stock: "made_to_order",
    }).map((item) => item.id),
  ).toEqual(["BF-001"]);
});

test("name search is case-insensitive", () => {
  expect(
    filterAdminProducts(products, { ...defaults, search: "ГОРТЕНЗИЯ" }).map((item) => item.id),
  ).toEqual(["BF-087"]);
});

test("category, publication, and stock filters retain their behavior", () => {
  expect(
    filterAdminProducts(products, { ...defaults, categoryId: "roses" }).map((item) => item.id),
  ).toEqual(["BF-009"]);
  expect(
    filterAdminProducts(products, { ...defaults, status: "draft" }).map((item) => item.id),
  ).toEqual(["BF-087"]);
  expect(
    filterAdminProducts(products, { ...defaults, stock: "made_to_order" }).map((item) => item.id),
  ).toEqual(["BF-009"]);
});

test("price sorting works in both directions", () => {
  expect(
    filterAdminProducts(products, { ...defaults, sort: "price-asc" }).map((item) => item.id),
  ).toEqual(["BF-009", "BF-001", "BF-087"]);
  expect(
    filterAdminProducts(products, { ...defaults, sort: "price-desc" }).map((item) => item.id),
  ).toEqual(["BF-087", "BF-001", "BF-009"]);
});
