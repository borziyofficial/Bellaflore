import { expect, test } from "@playwright/test";

const runLiveYandexE2E = process.env.RUN_LIVE_YANDEX_E2E === "1";
const addressQuery =
  process.env.SMOKE_YANDEX_ADDRESS_QUERY?.trim() || "Москва Красная площадь";
const productTitle = process.env.SMOKE_YANDEX_PRODUCT_TITLE?.trim() || "";

test.describe("live Yandex address checkout flow", () => {
  test.skip(
    !runLiveYandexE2E,
    "Requires real Yandex keys on the target environment. Run with RUN_LIVE_YANDEX_E2E=1.",
  );

  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test("suggestion selection resolves coordinates without submitting an order", async ({
    page,
    request,
  }) => {
    const catalogResponse = await request.get("/api/catalog/products?published=1");
    expect(catalogResponse.status()).toBe(200);
    const catalog = (await catalogResponse.json()) as {
      products?: Array<{ title?: string }>;
    };
    const title =
      productTitle ||
      catalog.products?.find((product) => product.title?.trim())?.title?.trim();
    expect(title, "target product title").toBeTruthy();

    const suggestResponses: number[] = [];
    const geocodeResponses: number[] = [];
    page.on("response", (response) => {
      const url = response.url();
      if (url.includes("/api/yandex-suggest")) {
        suggestResponses.push(response.status());
      }
      if (url.includes("/api/yandex-geocode") || url.includes("/api/yandex-retrieve")) {
        geocodeResponses.push(response.status());
      }
    });

    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByRole("textbox", { name: "Поиск букетов" }).fill(title ?? "");
    await page
      .getByRole("button", { name: `Открыть ${title}`, exact: true })
      .first()
      .click();

    const productDialog = page.getByRole("dialog", { name: title, exact: true });
    await expect(productDialog).toBeVisible();
    await productDialog
      .getByRole("button", { name: /^Купить$/ })
      .last()
      .click();

    const checkout = page.locator(".checkout-v3-sheet").first();
    await expect(checkout).toBeVisible();
    await checkout.getByRole("button", { name: /Адрес/ }).click();

    const addressInput = checkout.getByRole("textbox", {
      name: "Адрес доставки",
    });
    await addressInput.fill(addressQuery);

    await expect(page.locator("#checkout-address-suggestions button").first()).toBeVisible();
    await page.locator("#checkout-address-suggestions button").first().click();

    await expect(addressInput).not.toHaveValue(addressQuery);
    await expect
      .poll(() => suggestResponses.some((status) => status === 200))
      .toBe(true);
    await expect
      .poll(() => geocodeResponses.some((status) => status === 200))
      .toBe(true);
  });
});
