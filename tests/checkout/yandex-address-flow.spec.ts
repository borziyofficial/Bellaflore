import { expect, test, type Page } from "@playwright/test";

const ADDRESS_QUERY = "Москва Ярославское шоссе";
const SUGGESTION_LABEL = "Ярославское шоссе 1";
const RESOLVED_ADDRESS = "Россия, Москва, Ярославское шоссе, 1";
const RESOLVED_LATITUDE = 55.850536;
const RESOLVED_LONGITUDE = 37.679539;

async function openCheckout(page: Page) {
  await page.goto("/");
  const buyButton = page.getByRole("button", { name: "Купить Red Luxury" });
  await expect(buyButton).toBeVisible();
  await buyButton.click();

  const dialog = page.getByRole("dialog", { name: "Оформить заказ" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test("checkout Yandex address selection waits for 3 chars and resolves coordinates", async ({
  page,
}) => {
  let suggestRequestCount = 0;
  let geocodeRequestCount = 0;

  await page.route("**/api/yandex-suggest?**", async (route) => {
    suggestRequestCount += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        results: [
          {
            title: { text: SUGGESTION_LABEL },
            subtitle: { text: "Москва" },
            address: { formatted_address: RESOLVED_ADDRESS },
            uri: "ymapsbm1://geo?data=test-yaroslavskoe",
            provider: "yandex",
          },
        ],
      }),
    });
  });

  await page.route("**/api/yandex-geocode?**", async (route) => {
    geocodeRequestCount += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        results: [
          {
            formattedAddress: RESOLVED_ADDRESS,
            latitude: RESOLVED_LATITUDE,
            longitude: RESOLVED_LONGITUDE,
            precision: "exact",
          },
        ],
      }),
    });
  });

  const dialog = await openCheckout(page);
  const recipientTrigger = dialog.getByRole("button", { name: /^Получатель/ });
  if ((await recipientTrigger.getAttribute("aria-expanded")) !== "true") {
    await recipientTrigger.click();
  }
  await dialog.getByRole("textbox", { name: "Имя" }).fill("Анна");
  await dialog.getByRole("textbox", { name: "Телефон" }).fill("+7 999 111-22-33");

  const addressTrigger = dialog.getByRole("button", { name: /^Адрес/ });
  if ((await addressTrigger.getAttribute("aria-expanded")) !== "true") {
    await addressTrigger.click();
  }

  const addressInput = dialog.getByRole("textbox", {
    name: "Адрес доставки",
  });
  await addressInput.fill("Мо");
  await page.waitForTimeout(450);
  expect(suggestRequestCount).toBe(0);

  await addressInput.fill(ADDRESS_QUERY);
  const firstSuggestion = page.locator("#checkout-address-suggestions button").first();
  await expect(firstSuggestion).toBeVisible();
  await firstSuggestion.click();

  await expect(addressInput).toHaveValue(SUGGESTION_LABEL);
  await expect
    .poll(() => suggestRequestCount, { message: "Yandex suggest proxy calls" })
    .toBeGreaterThan(0);
  await expect
    .poll(() => geocodeRequestCount, { message: "Yandex geocode proxy calls" })
    .toBeGreaterThan(0);

  await expect(
    dialog.getByRole("button", { name: /(?:Показать на карте|Скрыть карту)/ }),
  ).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Оформить заказ" })).toBeEnabled();
});
