import { expect, test, type Locator, type Page } from "@playwright/test";

const CHECKOUT_ADDRESS = "Москва, Тверская улица, 1";
const CHECKOUT_STEP_NAMES = [
  "Получатель",
  "Доставка",
  "Адрес",
  "Оплата",
] as const;

async function openCheckout(page: Page) {
  await page.addInitScript((address) => {
    window.localStorage.setItem(
      "bellaflore_geocoding_cache_v1",
      JSON.stringify({
        [address]: {
          address,
          latitude: 55.7558,
          longitude: 37.6173,
          confidence: 0.99,
          provider: "yandex",
          status: "found",
          updatedAt: new Date().toISOString(),
        },
      }),
    );
  }, CHECKOUT_ADDRESS);

  await page.goto("/");
  const buyButton = page.getByRole("button", { name: "Купить Red Luxury" });
  await expect(buyButton).toBeVisible();
  await buyButton.click();

  const dialog = page.getByRole("dialog", { name: "Оформить заказ" });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function assertHeaderDoesNotOverlapFooter(
  trigger: Locator,
  footer: Locator,
) {
  const [triggerBox, footerBox] = await Promise.all([
    trigger.boundingBox(),
    footer.boundingBox(),
  ]);

  expect(triggerBox).not.toBeNull();
  expect(footerBox).not.toBeNull();

  if (!triggerBox || !footerBox) {
    return;
  }

  const overlapsVertically =
    Math.max(triggerBox.y, footerBox.y) <
    Math.min(triggerBox.y + triggerBox.height, footerBox.y + footerBox.height);
  const overlapsHorizontally =
    Math.max(triggerBox.x, footerBox.x) <
    Math.min(triggerBox.x + triggerBox.width, footerBox.x + footerBox.width);

  expect(overlapsVertically && overlapsHorizontally).toBe(false);
}

test("checkout remains scrollable, operable and valid at the target viewport", async ({
  page,
}) => {
  const dialog = await openCheckout(page);
  const footer = dialog.getByLabel("Итог");
  const submitButton = dialog.getByRole("button", { name: "Оформить заказ" });

  await expect(submitButton).toBeDisabled();

  for (const stepName of CHECKOUT_STEP_NAMES) {
    const trigger = dialog.getByRole("button", {
      name: new RegExp(`^${stepName}`),
    });

    await trigger.scrollIntoViewIfNeeded();
    await expect(trigger).toBeVisible();
    await expect(trigger).toBeEnabled();

    if ((await trigger.getAttribute("aria-expanded")) === "true") {
      await trigger.click();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    }

    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await assertHeaderDoesNotOverlapFooter(trigger, footer);
  }

  const layoutMetrics = await dialog.evaluate((dialogElement) => {
    const body = dialogElement.querySelector<HTMLElement>(".checkout-v3-body");
    const flow = dialogElement.querySelector<HTMLElement>(
      '[class*="checkoutGlassFlow"]',
    );
    const summary = dialogElement.querySelector<HTMLElement>('[aria-label="Итог"]');
    const candidates = body ? [body, ...body.querySelectorAll<HTMLElement>("*")] : [];
    const verticalScrollContainers = candidates.filter((element) => {
      const { overflowY } = window.getComputedStyle(element);
      return (
        (overflowY === "auto" || overflowY === "scroll") &&
        element.scrollHeight > element.clientHeight + 1
      );
    });

    return {
      bodyClassName: body?.className ?? null,
      flowBottom: flow?.getBoundingClientRect().bottom ?? null,
      footerPosition: summary
        ? window.getComputedStyle(summary).position
        : null,
      footerTop: summary?.getBoundingClientRect().top ?? null,
      verticalScrollContainerClasses: verticalScrollContainers.map(
        (element) => element.className,
      ),
    };
  });

  expect(layoutMetrics.verticalScrollContainerClasses).toEqual([
    "checkout-v3-body",
  ]);
  expect(layoutMetrics.footerPosition).toBe("static");
  expect(layoutMetrics.flowBottom).not.toBeNull();
  expect(layoutMetrics.footerTop).not.toBeNull();
  expect(layoutMetrics.flowBottom!).toBeLessThanOrEqual(
    layoutMetrics.footerTop! + 1,
  );

  const recipientTrigger = dialog.getByRole("button", {
    name: /^Получатель/,
  });
  if ((await recipientTrigger.getAttribute("aria-expanded")) !== "true") {
    await recipientTrigger.click();
  }
  await dialog.getByRole("textbox", { name: "Имя" }).fill("Анна");
  await dialog
    .getByRole("textbox", { name: "Телефон" })
    .fill("+7 999 111-22-33");

  const addressTrigger = dialog.getByRole("button", { name: /^Адрес/ });
  if ((await addressTrigger.getAttribute("aria-expanded")) !== "true") {
    await addressTrigger.click();
  }
  const addressInput = dialog.getByRole("textbox", {
    name: "Адрес доставки",
  });
  await addressInput.fill(CHECKOUT_ADDRESS);
  await addressInput.press("Tab");

  await expect(submitButton).toBeEnabled();
});
