import { expect, test } from "@playwright/test";
import { decodeDraftJson } from "../../lib/orders/draftJson";

const items = [{ productId: "published-product", size: "M", quantity: 1 }];
const conversation = { turns: [{ turn: 0, userMessage: "Выбираю букет" }] };

for (const [name, encode] of [
  ["native JSONB", (value: unknown) => value],
  ["legacy JSON string", (value: unknown) => JSON.stringify(value)],
  ["double-encoded legacy JSON", (value: unknown) => JSON.stringify(JSON.stringify(value))],
] as const) {
  test(`draft items and conversation survive ${name}`, () => {
    expect(decodeDraftJson(encode(items), [])).toEqual(items);
    expect(decodeDraftJson(encode(conversation), { turns: [] })).toEqual(conversation);
  });
}

test("empty and malformed drafts have safe JSON fallbacks", () => {
  expect(decodeDraftJson(null, [])).toEqual([]);
  expect(decodeDraftJson(undefined, { turns: [] })).toEqual({ turns: [] });
  expect(decodeDraftJson("not JSON", [])).toEqual([]);
});
