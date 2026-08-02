import { deliveryIntervals } from "@/components/checkout/deliveryIntervals";
import {
  ORDER_PAYMENT_METHODS,
  ORDER_SIZE_CODES,
  type CreateOrderInput,
  type OrderPaymentMethod,
  type OrderSizeCode,
} from "@/lib/orders/types";
import { OrderError } from "@/lib/orders/errors";

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;
const PHONE_PATTERN = /^\+?[0-9]{10,15}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readRequiredString(
  value: unknown,
  field: string,
  minLength: number,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    throw invalidField(field, "Поле должно быть строкой.");
  }

  const normalized = value.trim();
  if (normalized.length < minLength || normalized.length > maxLength) {
    throw invalidField(
      field,
      `Допустимая длина: от ${minLength} до ${maxLength} символов.`,
    );
  }

  return normalized;
}

function readOptionalString(value: unknown, field: string, maxLength: number): string {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value !== "string") {
    throw invalidField(field, "Поле должно быть строкой.");
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw invalidField(field, `Максимальная длина: ${maxLength} символов.`);
  }
  return normalized;
}

function readPhone(value: unknown, field: string): string {
  const phone = readRequiredString(value, field, 10, 32);
  const normalized = phone.replace(/[\s()-]/g, "");
  if (!PHONE_PATTERN.test(normalized)) {
    throw invalidField(field, "Укажите корректный номер телефона.");
  }
  return phone;
}

function readCoordinate(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw invalidField(field, `Ожидается число от ${min} до ${max}.`);
  }
  return value;
}

function getMoscowDateValue(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function readDeliveryDate(value: unknown, now: Date): string {
  const date = readRequiredString(value, "deliveryDate", 10, 10);
  if (!DATE_PATTERN.test(date)) {
    throw invalidField("deliveryDate", "Используйте формат YYYY-MM-DD.");
  }

  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw invalidField("deliveryDate", "Укажите существующую дату.");
  }
  if (date < getMoscowDateValue(now)) {
    throw invalidField("deliveryDate", "Дата доставки не может быть в прошлом.");
  }
  return date;
}

function readItems(value: unknown): CreateOrderInput["items"] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 50) {
    throw invalidField("items", "Заказ должен содержать от 1 до 50 позиций.");
  }

  const seen = new Set<string>();
  let totalQuantity = 0;
  const items = value.map((rawItem, index) => {
    if (!isRecord(rawItem)) {
      throw invalidField(`items[${index}]`, "Позиция должна быть объектом.");
    }

    const productId = readRequiredString(
      rawItem.productId,
      `items[${index}].productId`,
      1,
      200,
    );
    if (
      typeof rawItem.size !== "string" ||
      !ORDER_SIZE_CODES.includes(rawItem.size as OrderSizeCode)
    ) {
      throw invalidField(`items[${index}].size`, "Допустимые размеры: S, M, L, XL.");
    }
    if (
      typeof rawItem.quantity !== "number" ||
      !Number.isInteger(rawItem.quantity) ||
      rawItem.quantity < 1 ||
      rawItem.quantity > 20
    ) {
      throw invalidField(`items[${index}].quantity`, "Количество должно быть от 1 до 20.");
    }

    const duplicateKey = `${productId}\u0000${rawItem.size}`;
    if (seen.has(duplicateKey)) {
      throw invalidField("items", "Одинаковые товар и размер переданы более одного раза.");
    }
    seen.add(duplicateKey);
    totalQuantity += rawItem.quantity;

    return {
      productId,
      size: rawItem.size as OrderSizeCode,
      quantity: rawItem.quantity,
    };
  });

  if (totalQuantity > 50) {
    throw invalidField("items", "Общее количество товаров не должно превышать 50.");
  }
  return items;
}

function invalidField(field: string, message: string): OrderError {
  return new OrderError("INVALID_REQUEST", message, 400, { field });
}

export function parseIdempotencyKey(value: string | null): string {
  const key = value?.trim() ?? "";
  if (!IDEMPOTENCY_KEY_PATTERN.test(key)) {
    throw new OrderError(
      "INVALID_IDEMPOTENCY_KEY",
      "Заголовок Idempotency-Key обязателен и должен содержать 8–128 безопасных символов.",
      400,
    );
  }
  return key;
}

export function parseCreateOrderInput(value: unknown, now = new Date()): CreateOrderInput {
  if (!isRecord(value)) {
    throw new OrderError("INVALID_REQUEST", "Тело запроса должно быть JSON-объектом.", 400);
  }

  const paymentMethod = value.paymentMethod;
  if (
    typeof paymentMethod !== "string" ||
    !ORDER_PAYMENT_METHODS.includes(paymentMethod as OrderPaymentMethod)
  ) {
    throw invalidField(
      "paymentMethod",
      "Допустимые способы оплаты: cardTransfer, cashOnDelivery.",
    );
  }

  const deliveryInterval = readRequiredString(
    value.deliveryInterval,
    "deliveryInterval",
    1,
    32,
  );
  if (!deliveryIntervals.some((interval) => interval.label === deliveryInterval)) {
    throw invalidField("deliveryInterval", "Выберите существующий интервал доставки.");
  }

  return {
    customerName: readRequiredString(value.customerName, "customerName", 2, 120),
    customerPhone: readPhone(value.customerPhone, "customerPhone"),
    recipientName: readRequiredString(value.recipientName, "recipientName", 2, 120),
    recipientPhone: readPhone(value.recipientPhone, "recipientPhone"),
    deliveryAddress: readRequiredString(
      value.deliveryAddress,
      "deliveryAddress",
      5,
      500,
    ),
    deliveryLatitude: readCoordinate(
      value.deliveryLatitude,
      "deliveryLatitude",
      -90,
      90,
    ),
    deliveryLongitude: readCoordinate(
      value.deliveryLongitude,
      "deliveryLongitude",
      -180,
      180,
    ),
    deliveryDate: readDeliveryDate(value.deliveryDate, now),
    deliveryInterval,
    paymentMethod: paymentMethod as OrderPaymentMethod,
    customerComment: readOptionalString(value.customerComment, "customerComment", 1000),
    items: readItems(value.items),
  };
}
