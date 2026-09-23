import { test, expect } from "@playwright/test";

test.describe("AI Florist Draft to Order E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ai-consultant");
  });

  test("should create draft on mount", async ({ page }) => {
    // Wait for chat container to appear
    const title = page.getByText("AI-консультант BellaFlore");
    await expect(title).toBeVisible();
    
    // Session ID should be visible
    const sessionLabel = page.getByText(/ID сеанса:/);
    await expect(sessionLabel).toBeVisible();
  });

  test("should handle user message and AI response", async ({ page }) => {
    const input = page.getByPlaceholder("Напишите, что вы ищете...");
    const sendButton = page.getByRole("button", { name: "Отправить" });

    // Send a message
    await input.fill("Букет красных роз на день рождения");
    await sendButton.click();

    // Wait for user message to appear
    const userMessage = page.getByText("Букет красных роз на день рождения");
    await expect(userMessage).toBeVisible({ timeout: 10000 });
  });

  test("should display recommended products", async ({ page }) => {
    const input = page.getByPlaceholder("Напишите, что вы ищете...");
    const sendButton = page.getByRole("button", { name: "Отправить" });

    // Send a message that should trigger product recommendations
    await input.fill("Рекомендуй букеты");
    await sendButton.click();

    // Wait for product cards to appear
    const productCard = page.locator(".productCard");
    await expect(productCard.first()).toBeVisible({
      timeout: 10000,
    });

    // Should show product price
    const priceElement = page.locator(".productPrice");
    await expect(priceElement.first()).toBeVisible();
  });

  test("should show order summary button", async ({ page }) => {
    const summaryButton = page.getByRole("button", { name: /Сводка/ });
    await expect(summaryButton).toBeVisible();
  });

  test("should display order summary when requested", async ({ page }) => {
    const summaryButton = page.getByRole("button", { name: /Сводка/ });
    
    // Click summary button
    await summaryButton.click();

    // Wait for summary to appear
    const summaryTitle = page.getByText("Сводка заказа");
    await expect(summaryTitle).toBeVisible({
      timeout: 5000,
    });

    // Should show order details sections
    await expect(page.getByText(/Букеты/)).toBeVisible();
    await expect(page.getByText(/Заказчик/)).toBeVisible();
  });

  test("should show warning if order is incomplete", async ({ page }) => {
    const summaryButton = page.getByRole("button", { name: /Сводка/ });
    
    // Click summary button without filling in data
    await summaryButton.click();

    // Should show warning about incomplete order
    const warning = page.getByText(/Заполните все обязательные поля/);
    await expect(warning).toBeVisible();

    // Confirm button should be disabled
    const confirmButton = page.getByRole("button", { name: /Подтвердить заказ/ });
    await expect(confirmButton).toBeDisabled();
  });

  test("should validate product availability via API", async ({ request }) => {
    // Test product availability validation directly via API
    const response = await request.post("/api/ai-florist-tools", {
      data: {
        tool: "validate_product_availability",
        params: {
          productIds: ["test-id-1", "test-id-2"],
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data.status).toBe("ok");
    expect(data.data).toHaveProperty("allAvailable");
    expect(data.data).toHaveProperty("results");
  });

  test("should get draft summary via API", async ({ request }) => {
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
  });

  test("should update draft conversation state", async ({ request }) => {
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
                aiReply: "Прекрасно!",
              },
            ],
          },
        },
      },
    });

    expect(updateResponse.ok()).toBeTruthy();
    const updated = await updateResponse.json();
    
    expect(updated.conversationState.turns.length).toBeGreaterThan(0);
  });
});
