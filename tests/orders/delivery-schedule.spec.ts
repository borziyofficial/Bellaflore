import { expect, test } from "@playwright/test";
import {
  exactTimeSurcharge,
  parseDeliveryDateAnswer,
  parseDeliveryTimeAnswer,
} from "../../lib/orders/deliverySchedule";

const NOW = new Date("2026-09-24T09:00:00.000Z");

test("normalizes all supported interval answers without turning them into exact time", () => {
  for (const [answer, interval] of [
    ["09–12", "09:00–12:00"], ["09:00–12:00", "09:00–12:00"],
    ["с 9 до 12", "09:00–12:00"], ["12–15", "12:00–15:00"],
    ["12:00–15:00", "12:00–15:00"], ["с 12 до 15", "12:00–15:00"],
    ["15–18", "15:00–18:00"], ["15:00–18:00", "15:00–18:00"],
    ["18–21", "18:00–21:00"], ["18:00–21:00", "18:00–21:00"],
    ["с 18 до 21", "18:00–21:00"],
  ]) {
    expect(parseDeliveryTimeAnswer(answer)).toEqual({ mode: "interval", interval, exactTime: null });
  }
});

test("keeps requested exact time separate from interval", () => {
  for (const [answer, exactTime] of [
    ["14:20", "14:20"], ["16:25", "16:25"],
    ["ровно к 18:00", "18:00"], ["к 12:45", "12:45"],
  ]) {
    expect(parseDeliveryTimeAnswer(answer)).toEqual({ mode: "exact", interval: null, exactTime });
  }
});

test("normalizes today, tomorrow and dates at least twelve months ahead; rejects past", () => {
  expect(parseDeliveryDateAnswer("сегодня", NOW)).toBe("2026-09-24");
  expect(parseDeliveryDateAnswer("завтра", NOW)).toBe("2026-09-25");
  expect(parseDeliveryDateAnswer("10.10.2026", NOW)).toBe("2026-10-10");
  expect(parseDeliveryDateAnswer("10 октября", NOW)).toBe("2026-10-10");
  expect(parseDeliveryDateAnswer("10 октября 2026", NOW)).toBe("2026-10-10");
  expect(parseDeliveryDateAnswer("24.09.2027", NOW)).toBe("2027-09-24");
  expect(parseDeliveryTimeAnswer("2026-10-10")).toBeNull();
  expect(() => parseDeliveryDateAnswer("10.09.2026", NOW)).toThrow(/прошлом/);
});

test("exact-time surcharge uses catalog zone order, not zone-id text", () => {
  expect(exactTimeSurcharge("interval", "base")).toBe(0);
  expect(exactTimeSurcharge("exact", "base")).toBe(1000);
  expect(exactTimeSurcharge("exact", "21km")).toBe(1000);
  expect(exactTimeSurcharge("exact", "28km")).toBe(1500);
  expect(exactTimeSurcharge("exact", "48km")).toBe(1500);
  expect(1990 + exactTimeSurcharge("exact", "14km")).toBe(2990);
  expect(3990 + exactTimeSurcharge("exact", "28km")).toBe(5490);
});
