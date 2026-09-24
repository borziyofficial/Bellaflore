import { expect, test } from "@playwright/test";
import {
  createEmptyOrderDraft,
  hasCompleteDraftDeliveryTime,
  resolveDraftDeliveryTime,
} from "../../lib/orders/draftTypes";

test("existing draft without time remains pending after unrelated updates", () => {
  const existing = createEmptyOrderDraft();
  expect(resolveDraftDeliveryTime(existing, { customerName: "Анна" })).toEqual({
    deliveryMode: null,
    deliveryInterval: null,
    deliveryExactTime: null,
    deliveryTimeSurcharge: 0,
  });
  expect(hasCompleteDraftDeliveryTime(existing)).toBe(false);
});

test("new draft starts without a delivery mode, interval or exact time", () => {
  const draft = createEmptyOrderDraft("+79991112233");
  expect(draft.customerPhone).toBe("+79991112233");
  expect(draft.deliveryMode).toBeNull();
  expect(draft.deliveryInterval).toBeNull();
  expect(draft.deliveryExactTime).toBeNull();
  expect(draft.deliveryTimeSurcharge).toBe(0);
  expect(draft.status).toBe("active");
});

test("pending draft can be updated to ordinary interval 18–21", () => {
  const draft = createEmptyOrderDraft();
  const updated = resolveDraftDeliveryTime(draft, {
    deliveryMode: "interval", deliveryInterval: "18:00–21:00",
  });
  expect(updated).toEqual({
    deliveryMode: "interval",
    deliveryInterval: "18:00–21:00",
    deliveryExactTime: null,
    deliveryTimeSurcharge: 0,
  });
  expect(hasCompleteDraftDeliveryTime(updated)).toBe(true);
});

test("separate pending draft can be updated to exact 16:25", () => {
  const draft = createEmptyOrderDraft();
  const updated = resolveDraftDeliveryTime(draft, {
    deliveryMode: "exact", deliveryExactTime: "16:25", deliveryTimeSurcharge: 1000,
  });
  expect(updated).toEqual({
    deliveryMode: "exact",
    deliveryInterval: null,
    deliveryExactTime: "16:25",
    deliveryTimeSurcharge: 1000,
  });
  expect(hasCompleteDraftDeliveryTime(updated)).toBe(true);
});

test("draft-to-order conversion requires explicit completed mode", () => {
  const pending = createEmptyOrderDraft();
  expect(hasCompleteDraftDeliveryTime(pending)).toBe(false);
  expect(hasCompleteDraftDeliveryTime({ ...pending, deliveryInterval: "18:00–21:00" })).toBe(false);
  expect(hasCompleteDraftDeliveryTime({ ...pending, deliveryMode: "exact" })).toBe(false);
});
