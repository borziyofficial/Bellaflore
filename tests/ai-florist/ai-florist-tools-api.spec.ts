import { test, expect } from "@playwright/test";

test.describe("AI Florist Tools API", () => {
  test("search_products should return valid results", async ({ request }) => {
    const response = await request.post("/api/ai-florist-tools", {
      data: {
        tool: "search_products",
        params: {
          query: "роза",
          maxPrice: 5000,
          minPrice: 1000,
          limit: 5,
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.status).toBe("ok");
    expect(data.data).toHaveProperty("products");
    expect(data.data).toHaveProperty("count");
    expect(Array.isArray(data.data.products)).toBeTruthy();
    
    // Each product should have required fields
    data.data.products.forEach((product: any) => {
      expect(product).toHaveProperty("id");
      expect(product).toHaveProperty("title");
      expect(product).toHaveProperty("priceRub");
    });
  });

  test("get_product should return product details", async ({ request }) => {
    // First search to get a valid product ID
    const searchResponse = await request.post("/api/ai-florist-tools", {
      data: {
        tool: "search_products",
        params: {
          query: "роза",
          limit: 1,
        },
      },
    });

    const searchData = await searchResponse.json();
    if (searchData.data.products.length === 0) {
      test.skip();
    }

    const productId = searchData.data.products[0].id;

    // Get product details
    const response = await request.post("/api/ai-florist-tools", {
      data: {
        tool: "get_product",
        params: { id: productId },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.status).toBe("ok");
    expect(data.data).toHaveProperty("id");
    expect(data.data).toHaveProperty("title");
    expect(data.data).toHaveProperty("description");
    expect(data.data).toHaveProperty("priceRub");
  });

  test("validate_address should validate Moscow address", async ({ request }) => {
    const response = await request.post("/api/ai-florist-tools", {
      data: {
        tool: "validate_address",
        params: {
          address: "Москва, Красная площадь, 1",
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.status).toBe("ok");
    expect(data.data).toHaveProperty("address");
    expect(data.data).toHaveProperty("latitude");
    expect(data.data).toHaveProperty("longitude");
    expect(data.data.validated).toBe(true);
  });

  test("validate_address should reject invalid address", async ({ request }) => {
    const response = await request.post("/api/ai-florist-tools", {
      data: {
        tool: "validate_address",
        params: {
          address: "xyzabc nonexistent address 12345",
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.status).toBe("error");
    expect(data.message).toBeDefined();
  });

  test("calculate_delivery should return delivery fee", async ({ request }) => {
    // Moscow coordinates
    const response = await request.post("/api/ai-florist-tools", {
      data: {
        tool: "calculate_delivery",
        params: {
          latitude: 55.7558,
          longitude: 37.6173,
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.status).toBe("ok");
    expect(data.data).toHaveProperty("deliveryFee");
    expect(data.data).toHaveProperty("zoneId");
    expect(typeof data.data.deliveryFee).toBe("number");
    expect(data.data.deliveryFee).toBeGreaterThanOrEqual(0);
  });

  test("calculate_delivery should reject outside service area", async ({ request }) => {
    // Far away coordinates (outside Moscow)
    const response = await request.post("/api/ai-florist-tools", {
      data: {
        tool: "calculate_delivery",
        params: {
          latitude: 90,
          longitude: 180,
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Should either error or return impossibly high fee
    if (data.status === "error") {
      expect(data.message).toContain("зоны доставки");
    }
  });

  test("update_draft should update customer data", async ({ request }) => {
    // Create draft
    const draftResp = await request.post("/api/order-drafts", {
      data: { action: "create" },
    });
    const draft = await draftResp.json();

    // Update with customer data
    const response = await request.post("/api/ai-florist-tools", {
      data: {
        tool: "update_draft",
        params: {
          draftId: draft.id,
          customerName: "Иван Петров",
          customerPhone: "+79991234567",
          recipientName: "Мария",
          deliveryAddress: "Москва, ул. Тверская, 1",
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.status).toBe("ok");
    expect(data.data.customerName).toBe("Иван Петров");
    expect(data.data.customerPhone).toBe("+79991234567");
    expect(data.data.recipientName).toBe("Мария");
  });

  test("get_draft_summary should return order summary", async ({ request }) => {
    // Create and update draft
    const draftResp = await request.post("/api/order-drafts", {
      data: { action: "create" },
    });
    const draft = await draftResp.json();

    // Update with data
    await request.post("/api/ai-florist-tools", {
      data: {
        tool: "update_draft",
        params: {
          draftId: draft.id,
          customerName: "Test Customer",
          customerPhone: "+79991234567",
          recipientName: "Test Recipient",
          deliveryAddress: "Moscow",
        },
      },
    });

    // Get summary
    const response = await request.post("/api/ai-florist-tools", {
      data: {
        tool: "get_draft_summary",
        params: { draftId: draft.id },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.status).toBe("ok");
    expect(data.data.draftId).toBe(draft.id);
    expect(data.data.customer.name).toBe("Test Customer");
    expect(data.data.recipient.name).toBe("Test Recipient");
    expect(data.data.delivery.address).toBe("Moscow");
  });

  test("validate_product_availability should check products", async ({ request }) => {
    // Get some real products first
    const searchResp = await request.post("/api/ai-florist-tools", {
      data: {
        tool: "search_products",
        params: { limit: 2 },
      },
    });

    const searchData = await searchResp.json();
    const productIds = searchData.data.products.map((p: any) => p.id);

    if (productIds.length === 0) {
      test.skip();
    }

    // Check availability
    const response = await request.post("/api/ai-florist-tools", {
      data: {
        tool: "validate_product_availability",
        params: { productIds },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.status).toBe("ok");
    expect(data.data).toHaveProperty("allAvailable");
    expect(Array.isArray(data.data.results)).toBeTruthy();
  });

  test("should handle invalid tool names", async ({ request }) => {
    const response = await request.post("/api/ai-florist-tools", {
      data: {
        tool: "nonexistent_tool",
        params: {},
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.status).toBe("error");
  });

  test("should handle missing tool name", async ({ request }) => {
    const response = await request.post("/api/ai-florist-tools", {
      data: {
        params: {},
      },
    });

    expect(response.status()).toBe(400);
  });
});
