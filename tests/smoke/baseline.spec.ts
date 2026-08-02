import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

type CatalogSize = {
  label?: string;
  price?: number;
};

type CatalogProduct = {
  id?: string;
  title?: string;
  sizes?: CatalogSize[];
};

type CatalogPayload = {
  products?: CatalogProduct[];
  mode?: string;
};

type CategoriesPayload = {
  categories?: Array<{
    id?: string;
    title?: string;
    isActive?: boolean;
  }>;
};

const expectedCanonical = normalizeUrl(
  process.env.SMOKE_EXPECTED_CANONICAL?.trim() || "https://sandbox.bellaflore.ru",
);
const expectedNoindex = readBooleanEnv("SMOKE_EXPECT_NOINDEX", true);

function normalizeUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function readBooleanEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) {
    return fallback;
  }
  if (["1", "true", "yes"].includes(value)) {
    return true;
  }
  if (["0", "false", "no"].includes(value)) {
    return false;
  }
  throw new Error(`${name} must be true/false, 1/0, or yes/no.`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function readCatalog(request: APIRequestContext): Promise<CatalogPayload> {
  const response = await request.get("/api/catalog/products?published=1");
  expect(response.status(), "public products API status").toBe(200);
  const payload = (await response.json()) as CatalogPayload;
  expect(Array.isArray(payload.products), "products must be an array").toBe(true);
  expect(payload.products?.length ?? 0, "catalog must not be empty").toBeGreaterThan(0);
  return payload;
}

function selectSmokeProduct(products: CatalogProduct[]): CatalogProduct {
  const candidates = products.filter(
    (product): product is CatalogProduct & { id: string; title: string } =>
      typeof product.id === "string" &&
      product.id.length > 0 &&
      typeof product.title === "string" &&
      product.title.length > 0,
  );
  candidates.sort((left, right) => (right.sizes?.length ?? 0) - (left.sizes?.length ?? 0));
  const product = candidates[0];
  expect(product, "catalog must contain a product suitable for UI smoke testing").toBeTruthy();
  return product;
}

async function openHome(page: Page): Promise<void> {
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status(), "homepage HTTP status").toBe(200);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await waitForStorefrontHydration(page);
  await expect(page.locator("nextjs-portal")).toHaveCount(0);
}

async function waitForStorefrontHydration(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() =>
    Boolean((window as typeof window & { next?: unknown }).next),
  );
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
      }),
  );
}

test("homepage loads without a critical application error", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await openHome(page);
  await expect(page.getByLabel("Преимущества BellaFlore")).toBeVisible();
  expect(pageErrors, "uncaught browser errors").toEqual([]);
});

test("catalog route, search, and category selection work", async ({ page, request }) => {
  const { products = [] } = await readCatalog(request);
  const product = selectSmokeProduct(products);

  const response = await page.goto("/catalog", { waitUntil: "domcontentloaded" });
  expect(response?.status(), "catalog redirect response").toBeLessThan(400);
  await expect(page).toHaveURL(/\/#catalog$/);
  await waitForStorefrontHydration(page);

  const search = page.getByRole("textbox", { name: "Поиск букетов" });
  await expect(search).toBeVisible();
  await search.fill("zzqjx-no-match-987654321");
  await expect(page.getByText("Букеты не найдены", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Очистить поиск" }).click();

  const categoryTabs = page
    .getByRole("tablist", { name: "Категории букетов" })
    .getByRole("tab");
  expect(await categoryTabs.count(), "catalog must expose category tabs").toBeGreaterThan(1);
  const category = categoryTabs.nth(1);
  await category.click();
  await expect(category).toHaveAttribute("aria-selected", "true");
  await expect(page).toHaveURL(/category=[^&#]+/);

  await search.fill(product.title ?? "");
  await expect(
    page.getByRole("button", { name: `Открыть ${product.title}`, exact: true }).first(),
  ).toBeVisible();
});

test("a product card opens and exposes size and price controls", async ({ page, request }) => {
  const { products = [] } = await readCatalog(request);
  const product = selectSmokeProduct(products);
  const productTitle = product.title ?? "";

  await openHome(page);
  await page.getByRole("textbox", { name: "Поиск букетов" }).fill(productTitle);

  const openButton = page
    .getByRole("button", { name: `Открыть ${productTitle}`, exact: true })
    .first();
  await expect(openButton).toBeVisible();
  const card = openButton.locator("xpath=ancestor::article");
  const sizeControls = card.getByRole("radio");
  expect(await sizeControls.count(), "product card must expose at least one size").toBeGreaterThan(0);

  for (const size of product.sizes ?? []) {
    if (!size.label) {
      continue;
    }
    await expect(
      card.getByRole("radio", {
        name: new RegExp(`^Размер ${escapeRegExp(size.label)},.*₽$`),
      }),
    ).toBeVisible();
  }

  const lastSize = sizeControls.last();
  await expect(lastSize).toHaveAccessibleName(/₽$/);
  await lastSize.click();
  await expect(lastSize).toHaveAttribute("aria-checked", "true");
  await expect(card.getByText(/₽/).first()).toBeVisible();

  await openButton.click();
  const productDialog = page.getByRole("dialog", { name: productTitle, exact: true });
  await expect(productDialog).toBeVisible();
  await expect(productDialog.getByRole("heading", { level: 1, name: productTitle })).toBeVisible();
  await expect(productDialog.getByRole("button", { name: /Размер:/ })).toContainText(/₽/);
});

test("admin login rejects invalid credentials and protected API stays closed", async ({
  page,
  request,
}) => {
  const response = await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
  expect(response?.status(), "admin login HTTP status").toBe(200);
  await expect(page.getByRole("heading", { name: "Вход администратора" })).toBeVisible();

  await page.getByLabel("Имя пользователя").fill("invalid-smoke-user");
  await page.getByLabel("Пароль").fill("invalid-smoke-password");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page.getByText(/Невер|ошиб/i).first()).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login/);

  const protectedResponse = await request.get("/api/admin/products");
  expect(protectedResponse.status(), "protected admin API status").toBe(401);
});

test("public catalog APIs return stable JSON contracts", async ({ request }) => {
  const catalog = await readCatalog(request);
  const firstProduct = catalog.products?.[0];
  expect(typeof firstProduct?.id, "product id").toBe("string");
  expect(typeof firstProduct?.title, "product title").toBe("string");
  expect(typeof catalog.mode, "catalog mode").toBe("string");

  const categoriesResponse = await request.get("/api/catalog/categories");
  expect(categoriesResponse.status(), "public categories API status").toBe(200);
  const categories = (await categoriesResponse.json()) as CategoriesPayload;
  expect(Array.isArray(categories.categories), "categories must be an array").toBe(true);
  expect(categories.categories?.length ?? 0, "categories must not be empty").toBeGreaterThan(0);
  expect(typeof categories.categories?.[0]?.id, "category id").toBe("string");
  expect(typeof categories.categories?.[0]?.title, "category title").toBe("string");
});

test("canonical, robots, noindex, and Open Graph match the target environment", async ({
  page,
  request,
}) => {
  await openHome(page);

  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute("href", expectedCanonical);
  const robotsContent = (await page.locator('meta[name="robots"]').getAttribute("content")) ?? "";
  if (expectedNoindex) {
    expect(robotsContent).toMatch(/noindex/i);
    expect(robotsContent).toMatch(/nofollow/i);
  } else {
    expect(robotsContent).not.toMatch(/noindex/i);
  }

  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /.+/);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    expectedCanonical,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /^https?:\/\//,
  );

  const robotsResponse = await request.get("/robots.txt");
  expect(robotsResponse.status(), "robots.txt status").toBe(200);
  const robotsText = await robotsResponse.text();
  expect(robotsText).toContain("User-Agent: *");
  expect(robotsText).toContain("Disallow: /admin");
  expect(robotsText).toContain("Sitemap:");
});

test.describe("mobile baseline", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test("390x844 layout has no horizontal overflow and navigation is available", async ({
    page,
  }) => {
    await openHome(page);
    await expect(page.getByRole("navigation", { name: "Быстрая мобильная навигация" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Каталог", exact: true })).toBeVisible();

    const menuButton = page.getByRole("button", { name: "Открыть меню" });
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await expect(page.getByRole("navigation", { name: "Мобильное меню" })).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.viewportWidth).toBe(390);
    expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
  });
});
