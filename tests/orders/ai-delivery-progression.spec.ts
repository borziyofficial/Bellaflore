import { expect, test } from "@playwright/test";
import { POST } from "../../app/api/ai-florist/route";

type DraftSummary = {
  items: Array<{ productId: string; title: string; price: number }>;
  customer: { name: string; phone: string };
  recipient: { name: string; phone: string };
  delivery: {
    address: string;
    zoneId: string;
    date: string | null;
    interval: string | null;
    mode: "interval" | "exact";
    exactTime: string | null;
    baseDeliveryFee: number;
    deliveryTimeSurcharge: number;
    deliveryFee: number;
  };
  grandTotal: number;
};

function summary(date: string | null): DraftSummary {
  return {
    items: [{ productId: "rose-51", title: "51 Белая Роза", price: 10900 }],
    customer: { name: "Анна", phone: "+79991112233" },
    recipient: { name: "Мария", phone: "+79994445566" },
    delivery: {
      address: "Москва, Красная площадь, 1", zoneId: "base", date,
      interval: null, mode: "interval", exactTime: null,
      baseDeliveryFee: 790, deliveryTimeSurcharge: 0, deliveryFee: 790,
    },
    grandTotal: 11690,
  };
}

async function withDraftTools(
  draft: DraftSummary,
  run: (updates: Record<string, unknown>[]) => Promise<void>,
) {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key";
  const updates: Record<string, unknown>[] = [];
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const call = JSON.parse(String(init?.body)) as { tool: string; params: Record<string, unknown> };
    if (call.tool === "get_draft_summary") return Response.json({ status: "ok", data: draft });
    if (call.tool === "update_draft") {
      updates.push(call.params);
      if (typeof call.params.deliveryDate === "string") draft.delivery.date = call.params.deliveryDate;
      if (typeof call.params.deliveryInterval === "string") {
        draft.delivery.mode = "interval";
        draft.delivery.interval = call.params.deliveryInterval;
        draft.delivery.exactTime = null;
      }
      if (typeof call.params.deliveryExactTime === "string") {
        draft.delivery.mode = "exact";
        draft.delivery.interval = null;
        draft.delivery.exactTime = call.params.deliveryExactTime;
        draft.delivery.deliveryTimeSurcharge = 1000;
        draft.delivery.deliveryFee = 1790;
        draft.grandTotal = 12690;
      }
      return Response.json({ status: "ok", data: draft });
    }
    throw new Error(`Unexpected tool: ${call.tool}`);
  }) as typeof fetch;
  try {
    await run(updates);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
}

async function ask(message: string) {
  const response = await POST(new Request("https://example.test/api/ai-florist", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "order-flow-test" },
    body: JSON.stringify({ draftId: "draft-test", messages: [{ role: "user", content: message }] }),
  }));
  expect(response.status).toBe(200);
  return response.json();
}

test("18:00–21:00 answer is saved before next-step guard and card never repeats", async () => {
  const draft = summary("2026-10-10");
  await withDraftTools(draft, async (updates) => {
    const answer = await ask("18:00–21:00");
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({ deliveryMode: "interval", deliveryInterval: "18:00–21:00" });
    expect(answer.reply).toContain("Перед оформлением");
    expect(answer.reply).not.toMatch(/Какой интервал/);
    expect(answer.recommendedProductIds).toEqual([]);
    const repeat = await ask("Спасибо");
    expect(repeat.reply).not.toMatch(/Какой интервал/);
    expect(repeat.recommendedProductIds).toEqual([]);
    expect(draft.items[0].productId).toBe("rose-51");
  });
});

test("16:25 exact request stays separate from interval in summary", async () => {
  const draft = summary("2026-10-10");
  await withDraftTools(draft, async (updates) => {
    const answer = await ask("ровно к 16:25");
    expect(updates[0]).toMatchObject({ deliveryMode: "exact", deliveryExactTime: "16:25" });
    expect(updates[0]).not.toHaveProperty("deliveryInterval");
    expect(draft.delivery.interval).toBeNull();
    expect(answer.reply).toContain("16:25");
    expect(answer.reply).toMatch(/Точное время.*\+1[\s\u00a0]?000/);
    expect(answer.reply).toMatch(/требует подтверждения/);
  });
});

test("future date 10.10.2026 is saved before asking for time", async () => {
  const draft = summary(null);
  await withDraftTools(draft, async (updates) => {
    const answer = await ask("10.10.2026");
    expect(updates[0]).toMatchObject({ deliveryDate: "2026-10-10" });
    expect(draft.delivery.date).toBe("2026-10-10");
    expect(answer.reply).toMatch(/Какой интервал/);
    expect(answer.reply).not.toMatch(/На какую дату/);
    expect(answer.recommendedProductIds).toEqual([]);
  });
});
