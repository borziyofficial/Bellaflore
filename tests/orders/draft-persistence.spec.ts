/**
 * Draft Persistence E2E Test
 * 
 * РАЗДЕЛ: Проверка персистентности черновиков заказов
 * 
 * Verifies that:
 * 1. Order drafts are created in the database
 * 2. Draft data persists across multiple requests
 * 3. Draft updates are properly saved
 * 4. Draft retrieval returns correct data
 * 5. Conversation state tracking works
 */

import { expect, test } from "@playwright/test";

// Use the production/staging domain if available
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

test.describe("Order Draft Persistence (Phase 2)", () => {
  test("should create a draft and persist data across requests", async ({
    request,
  }) => {
    // Step 1: Create a new draft
    const createResponse = await request.post(`${BASE_URL}/api/order-drafts`, {
      data: {
        action: "create",
        customerPhone: "+7 999 111-22-33",
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const draft = await createResponse.json();
    expect(draft.id).toBeDefined();
    const draftId = draft.id;

    console.log(`✓ Draft created with ID: ${draftId}`);

    // Step 2: Verify draft exists by retrieving it
    const getResponse = await request.post(`${BASE_URL}/api/order-drafts`, {
      data: {
        action: "load",
        draftId,
      },
    });

    expect(getResponse.ok()).toBeTruthy();
    const retrieved = await getResponse.json();
    expect(retrieved.id).toBe(draftId);
    expect(retrieved.status).toBe("active");
    expect(retrieved.conversationState).toBeDefined();
    expect(retrieved.conversationState.turns).toBeInstanceOf(Array);

    console.log(`✓ Draft retrieved successfully`);

    // Step 3: Update the draft with conversation state
    const updateResponse = await request.post(`${BASE_URL}/api/order-drafts`, {
      data: {
        action: "update",
        draftId,
        updates: {
          customerName: "Анна",
          customerPhone: "+7 999 111-22-33",
          recipientName: "Мария",
          recipientPhone: "+7 999 444-55-66",
          deliveryAddress: "Москва, Красная площадь, 1",
          conversationState: {
            turns: [
              {
                turn: 1,
                timestamp: new Date().toISOString(),
                userMessage: "Привет, мне нужны цветы",
                aiReply:
                  "Добро пожаловать в BellaFlore! Помогу вам выбрать идеальные цветы.",
                recommendedProductIds: ["rose-101", "rose-102"],
              },
            ],
          },
          items: [{ productId: "rose-101", size: "M", quantity: 1 }],
        },
      },
    });

    expect(updateResponse.ok()).toBeTruthy();
    const updated = await updateResponse.json();
    expect(updated.id).toBe(draftId);
    expect(updated.customerName).toBe("Анна");
    expect(updated.conversationState.turns).toHaveLength(1);
    expect(updated.items).toHaveLength(1);

    console.log(`✓ Draft updated with conversation state and items`);

    // Step 4: Retrieve in a separate request and verify persistence
    const reloadResponse = await request.post(`${BASE_URL}/api/order-drafts`, {
      data: {
        action: "load",
        draftId,
      },
    });

    expect(reloadResponse.ok()).toBeTruthy();
    const reloaded = await reloadResponse.json();
    expect(reloaded.id).toBe(draftId);
    expect(reloaded.customerName).toBe("Анна");
    expect(reloaded.recipientName).toBe("Мария");
    expect(reloaded.deliveryAddress).toBe("Москва, Красная площадь, 1");
    expect(reloaded.conversationState.turns).toHaveLength(1);
    expect(reloaded.conversationState.turns[0].userMessage).toBe(
      "Привет, мне нужны цветы",
    );
    expect(reloaded.items).toHaveLength(1);
    expect(reloaded.items[0].productId).toBe("rose-101");

    console.log(`✓ Draft persistence verified across separate requests`);
  });

  test("should retrieve draft by customer phone", async ({ request }) => {
    const phone = "+7 999 777-88-99";

    // Create a draft with customer phone
    const createResponse = await request.post(`${BASE_URL}/api/order-drafts`, {
      data: {
        action: "create",
        customerPhone: phone,
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const draft = await createResponse.json();
    const draftId = draft.id;

    console.log(`✓ Draft created with phone ${phone}`);

    // Retrieve drafts by phone using GET request
    const getResponse = await request.get(
      `${BASE_URL}/api/order-drafts?phone=${encodeURIComponent(phone)}`,
    );

    expect(getResponse.ok()).toBeTruthy();
    const drafts = await getResponse.json();
    expect(Array.isArray(drafts)).toBeTruthy();
    expect(drafts.length).toBeGreaterThan(0);

    const found = drafts.find((d: { id: string; customerPhone?: string }) => d.id === draftId);
    expect(found).toBeDefined();
    expect(found.customerPhone).toBe(phone);

    console.log(`✓ Draft retrieved successfully by customer phone`);
  });

  test("should handle multiple sequential updates", async ({ request }) => {
    // Create draft
    const createResponse = await request.post(`${BASE_URL}/api/order-drafts`, {
      data: {
        action: "create",
        customerPhone: "+7 999 555-66-77",
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const draft = await createResponse.json();
    const draftId = draft.id;

    console.log(`✓ Draft created: ${draftId}`);

    // Sequential update 1: Add customer info
    const update1 = await request.post(`${BASE_URL}/api/order-drafts`, {
      data: {
        action: "update",
        draftId,
        updates: {
          customerName: "Иван",
          customerPhone: "+7 999 555-66-77",
        },
      },
    });

    expect(update1.ok()).toBeTruthy();
    console.log(`✓ Update 1: Customer info added`);

    // Sequential update 2: Add recipient info
    const update2 = await request.post(`${BASE_URL}/api/order-drafts`, {
      data: {
        action: "update",
        draftId,
        updates: {
          recipientName: "Елена",
          recipientPhone: "+7 999 000-11-22",
        },
      },
    });

    expect(update2.ok()).toBeTruthy();
    console.log(`✓ Update 2: Recipient info added`);

    // Sequential update 3: Add delivery info
    const update3 = await request.post(`${BASE_URL}/api/order-drafts`, {
      data: {
        action: "update",
        draftId,
        updates: {
          deliveryAddress: "Санкт-Петербург, Невский проспект, 25",
          deliveryDate: "2026-09-25",
          deliveryInterval: "10:00–13:00",
        },
      },
    });

    expect(update3.ok()).toBeTruthy();
    console.log(`✓ Update 3: Delivery info added`);

    // Final retrieval and verification
    const finalResponse = await request.post(`${BASE_URL}/api/order-drafts`, {
      data: {
        action: "load",
        draftId,
      },
    });

    expect(finalResponse.ok()).toBeTruthy();
    const final = await finalResponse.json();

    expect(final.customerName).toBe("Иван");
    expect(final.recipientName).toBe("Елена");
    expect(final.deliveryAddress).toBe("Санкт-Петербург, Невский проспект, 25");
    expect(final.deliveryDate).toBe("2026-09-25");

    console.log(`✓ All sequential updates persisted correctly`);
  });
});
