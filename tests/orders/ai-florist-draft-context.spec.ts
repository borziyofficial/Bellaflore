import { expect, test } from "@playwright/test";
import { POST } from "../../app/api/ai-florist/route";

const draftId = "persisted-draft";
const productId = "published-catalog-product";

test("AI receives the persisted selection and draft ID before the next turn", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const requests: Array<Record<string, any>> = [];
  process.env.OPENAI_API_KEY = "test-placeholder";

  globalThis.fetch = async (_input, init) => {
    const payload = JSON.parse(String(init?.body));
    requests.push(payload);
    if (payload.tool === "get_draft_summary") {
      expect(payload.params.draftId).toBe(draftId);
      return Response.json({ status: "ok", data: {
        draftId,
        items: [{ productId, title: "Выбранный букет", size: "M", quantity: 1, price: 8490 }],
        customer: {}, recipient: {}, delivery: {},
      } });
    }
    if (payload.tool === "update_draft") {
      expect(payload.params).toMatchObject({ draftId, customerName: "E2E Test Client" });
      return Response.json({ status: "ok", data: { id: draftId, customerName: "E2E Test Client" } });
    }
    if (!payload.previous_response_id) {
      expect(payload.instructions).toContain(draftId);
      expect(payload.instructions).toContain(productId);
      expect(payload.instructions).toContain("Выбранный букет");
      return Response.json({ id: "response-1", output: [{
        type: "function_call", call_id: "save-contact", name: "update_draft",
        arguments: JSON.stringify({ draftId: "model-placeholder", customerName: "E2E Test Client" }),
      }] });
    }
    return Response.json({ id: "response-2", model: "gpt-5.6-sol", output: [{
      type: "message", content: [{ type: "output_text", text: "Имя сохранено. Напишите телефон." }],
    }] });
  };

  try {
    const response = await POST(new Request("http://localhost/api/ai-florist", {
      method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": "draft-context-test" },
      body: JSON.stringify({ draftId, messages: [{ role: "user", content: "Меня зовут E2E Test Client" }] }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ mode: "ai", modelUsed: "gpt-5.6-sol", recommendedProductIds: [] });
    expect(requests[0].tool).toBe("get_draft_summary");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
});

test("product search without a draft still returns real tool product IDs", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-placeholder";
  globalThis.fetch = async (_input, init) => {
    const payload = JSON.parse(String(init?.body));
    if (payload.tool === "search_products") {
      return Response.json({ status: "ok", data: { products: [{ id: productId, priceRub: 8490 }] } });
    }
    if (!payload.previous_response_id) {
      return Response.json({ id: "search-response-1", output: [{
        type: "function_call", call_id: "search", name: "search_products", arguments: '{"query":"гортензии"}',
      }] });
    }
    return Response.json({ id: "search-response-2", model: "gpt-5.6-sol", output: [{
      type: "message", content: [{ type: "output_text", text: "Вот подходящий букет." }],
    }] });
  };
  try {
    const response = await POST(new Request("http://localhost/api/ai-florist", {
      method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": "product-search-test" },
      body: JSON.stringify({ messages: [{ role: "user", content: "Гортензии до 10 000 ₽" }] }),
    }));
    expect(await response.json()).toMatchObject({ mode: "ai", modelUsed: "gpt-5.6-sol", recommendedProductIds: [productId] });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
});
