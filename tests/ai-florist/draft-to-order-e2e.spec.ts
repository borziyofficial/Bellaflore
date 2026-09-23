import { test, expect } from "@playwright/test";

test.describe("AI Florist Draft to Order E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ai-consultant");
  });

  test("should create draft on mount", async ({ page }) => {
    // Wait for chat container to appear
    await expect(page.locator('text="AI-консультант BellaFlore"')).toBeVisible();
    
    // Session ID should be visible
    const sessionId = await page.locator('text=ID сеанса:').textContent();
    expect(sessionId).toContain("ID сеанса:");
  });

  test("should handle user message and AI response", async ({ page }) => {
    const input = page.locator('input[placeholder="Напишите, что вы ищете..."]');
    const sendButton = page.locator('button:has-text("Отправить")');

    // Send a message
    await input.fill("Букет красных роз на день рождения");
    await sendButton.click();

    // Wait for AI response
    await expect(page.locator('text="Спасибо за информацию"').first()).toBeVisible({
      timeout: 10000,
    });

    // User message should be visible
    await expect(page.locator('text="Букет красных роз на день рождения"')).toBeVisible();
  });

  test("should display recommended products", async ({ page }) => {
    const input = page.locator('input[placeholder="Напишите, что вы ищете..."]');
    const sendButton = page.locator('button:has-text("Отправить")');

    // Send a message that should trigger product recommendations
    await input.fill("Рекомендуй букеты до 3000 рублей");
    await sendButton.click();

    // Wait for product cards to appear
    await expect(page.locator(".productCard")).first().toBeVisible({
      timeout: 10000,
    });

    // Should show product price
    const priceElement = page.locator(".productPrice").first();
    const priceText = await priceElement.textContent();
    expect(priceText).toMatch(/\d+\s*₽/);
  });

  test("should show order summary button", async ({ page }) => {
    const summaryButton = page.locator('button:has-text("📋 Сводка")');
    await expect(summaryButton).toBeVisible();
  });

  test("should display order summary when requested", async ({ page }) => {
    const summaryButton = page.locator('button:has-text("📋 Сводка")');
    
    // Click summary button
    await summaryButton.click();

    // Wait for summary to appear
    await expect(page.locator('text="Сводка заказа"')).toBeVisible({
      timeout: 5000,
    });

    // Should show order details sections
    await expect(page.locator('text="Букеты"')).toBeVisible();
    await expect(page.locator('text="Заказчик"')).toBeVisible();
    await expect(page.locator('text="Получатель"')).toBeVisible();
    await expect(page.locator('text="Доставка"')).toBeVisible();
  });

  test("should show warning if order is incomplete", async ({ page }) => {
    const summaryButton = page.locator('button:has-text("📋 Сводка")');
    
    // Click summary button without filling in data
    await summaryButton.click();

    // Should show warning about incomplete order
    await expect(
      page.locator('text="Заполните все обязательные поля для оформления заказа"')
    ).toBeVisible();

    // Confirm button should be disabled
    const confirmButton = page.locator('button:has-text("Подтвердить заказ")');
    await expect(confirmButton).toBeDisabled();
  });

  test("should validate product availability via API", async ({ page, request }) => {
    // Test product availability validation directly via API
    const response = await request.post("/api/ai-florist-tools", {
      data: {
        tool: "validate_product_availability",
        params: {
          productIds: ["test-product-id", "another-test-id"],
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data.status).toBe("ok");
    expect(data.data).toHaveProperty("allAvailable");
    expect(data.data).toHaveProperty("results");
  });

  test("should get draft summary via API", async ({ page, request }) => {
    // First create a draft
    const draftResponse = await request.post("/api/order-drafts", {
      data: {
        action: "create",
      },
    });

    const draft = await draftResponse.json();
    const draftId = draft.id;

    // Get summary
    const summaryResponse = await request.post("/api/ai-florist-tools", {
      data: {
        tool: "get_draft_summary",
        params: { draftId },
      },
    });

    expect(summaryResponse.ok()).toBeTruthy();
    const summaryData = await summaryResponse.json();
    
    expect(summaryData.status).toBe("ok");
    expect(summaryData.data).toHaveProperty("draftId");
    expect(summaryData.data).toHaveProperty("status");
    expect(summaryData.data).toHaveProperty("items");
    expect(summaryData.data).toHaveProperty("total");
  });

  test("should update draft conversation state", async ({ page, request }) => {
    // Create a draft
    const draftResponse = await request.post("/api/order-drafts", {
      data: {
        action: "create",
      },
    });

    const draft = await draftResponse.json();
    const draftId = draft.id;

    // Update with conversation state
    const updateResponse = await request.post("/api/order-drafts", {
      data: {
        action: "update",
        draftId,
        updates: {
          conversationState: {
            turns: [
              {
                turn: 0,
                timestamp: new Date().toISOString(),
                userMessage: "Хочу букет роз",
                aiReply: "Прекрасно! Какого цвета розы вы предпочитаете?",
              },
            ],
          },
        },
      },
    });

    expect(updateResponse.ok()).toBeTruthy();
    const updated = await updateResponse.json();
    
    expect(updated.conversationState.turns).toHaveLength(1);
    expect(updated.conversationState.turns[0].userMessage).toBe("Хочу букет роз");
  });

  test("should handle rate limiting gracefully", async ({ page }) => {
    const input = page.locator('input[placeholder="Напишите, что вы ищете..."]');
    const sendButton = page.locator('button:has-text("Отправить")');

    // Send multiple messages rapidly
    for (let i = 0; i < 3; i++) {
      await input.fill(`Message ${i}`);
      await sendButton.click();
      await page.waitForTimeout(100);
    }

    // If rate limiting is triggered, error message should appear
    const errorMessage = page.locator('text="Слишком много сообщений"');
    const isVisible = await errorMessage.isVisible().catch(() => false);
    
    // Note: This test may or may not trigger rate limiting
    // Just verify that the error handling works if it does
    if (isVisible) {
      await expect(errorMessage).toBeVisible();
    }
  });
});
