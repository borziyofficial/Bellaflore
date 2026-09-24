import { test, expect } from "@playwright/test";

test.describe("BellaFlore AI order-flow regression", () => {
  test("full address keeps apartment details but geocodes only street and house", async ({ request }) => {
    const fullAddress =
      "Москва, Палехская улица, 15, подъезд 2, этаж 8, квартира 66";

    const response = await request.post("/api/ai-florist-tools", {
      data: {
        tool: "validate_address",
        params: { address: fullAddress },
      },
    });

    expect(response.ok()).toBeTruthy();

    const body = await response.json();

    expect(body.status).toBe("ok");
    expect(body.data.address).toBe(fullAddress);
    expect(body.data.geocodeAddress).toContain("Палехская");
    expect(body.data.geocodeAddress).toContain("15");
    expect(body.data.geocodeAddress).not.toMatch(
      /подъезд|этаж|квартир/i,
    );
  });

  test("draft remembers customer, recipient and delivery address", async ({ request }) => {
    const createResponse = await request.post("/api/order-drafts", {
      data: { action: "create" },
    });

    expect(createResponse.ok()).toBeTruthy();

    const draft = await createResponse.json();

    const updateResponse = await request.post("/api/ai-florist-tools", {
      data: {
        tool: "update_draft",
        params: {
          draftId: draft.id,
          customerName: "Камол",
          customerPhone: "+79671677778",
          recipientName: "Получатель",
          recipientPhone: "+79991234567",
          deliveryAddress:
            "Москва, Палехская улица, 15, подъезд 2, этаж 8, квартира 66",
        },
      },
    });

    expect(updateResponse.ok()).toBeTruthy();

    const summaryResponse = await request.post("/api/ai-florist-tools", {
      data: {
        tool: "get_draft_summary",
        params: { draftId: draft.id },
      },
    });

    expect(summaryResponse.ok()).toBeTruthy();

    const summary = await summaryResponse.json();

    expect(summary.status).toBe("ok");
    expect(summary.data.customer.name).toBe("Камол");
    expect(summary.data.customer.phone).toBe("+79671677778");
    expect(summary.data.recipient.name).toBe("Получатель");
    expect(summary.data.recipient.phone).toBe("+79991234567");
    expect(summary.data.delivery.address).toContain("Палехская");
    expect(summary.data.delivery.address).toContain("квартира 66");

    await request.delete(
      `/api/order-drafts?id=${encodeURIComponent(draft.id)}`,
    );
  });

  test("AI moves forward instead of asking known customer data again", async ({ request }) => {
    const productResponse = await request.post("/api/ai-florist-tools", {
      data: {
        tool: "search_products",
        params: { limit: 1 },
      },
    });

    const productData = await productResponse.json();
    expect(productData.status).toBe("ok");
    expect(productData.data.products.length).toBeGreaterThan(0);

    const productId = productData.data.products[0].id;

    const createResponse = await request.post("/api/order-drafts", {
      data: { action: "create" },
    });

    const draft = await createResponse.json();

    const updateResponse = await request.post("/api/ai-florist-tools", {
      data: {
        tool: "update_draft",
        params: {
          draftId: draft.id,
          customerName: "Камол",
          customerPhone: "+79671677778",
          recipientName: "Получатель",
          recipientPhone: "+79991234567",
          deliveryAddress:
            "Москва, Палехская улица, 15, подъезд 2, этаж 8, квартира 66",
          items: [
            {
              productId,
              size: "M",
              quantity: 1,
            },
          ],
        },
      },
    });

    expect(updateResponse.ok()).toBeTruthy();

    const aiResponse = await request.post("/api/ai-florist", {
      data: {
        draftId: draft.id,
        messages: [
          {
            role: "user",
            content: "Хорошо, что дальше?",
          },
        ],
      },
    });

    expect(aiResponse.ok()).toBeTruthy();

    const ai = await aiResponse.json();

    expect(ai.mode).toBe("ai");
    expect(ai.reply).toMatch(/дат|сегодня|завтра/i);
    expect(ai.reply).not.toMatch(
      /укажите.*имя|укажите.*телефон|укажите.*адрес|ближайшее метро|ориентир/i,
    );

    await request.delete(
      `/api/order-drafts?id=${encodeURIComponent(draft.id)}`,
    );
  });
});
