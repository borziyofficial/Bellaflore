// ==================================================
// SECTION: ORDER INTELLIGENCE
// РАЗДЕЛ: Checkout bridge
// ==================================================
import type { CheckoutOrderPayload } from "@/components/checkout/checkoutTypes";
import type { CatalogProductSizeId } from "@/components/catalogEngine/catalogTypes";
import { handleOrderInventoryOnCreate } from "@/components/orderIntelligence/orderInventoryBridge";
import { createOrder } from "@/components/orderIntelligence/orderStoreEngine";
import type {
  Order,
  OrderInventoryIntegrationPlan,
  OrderItem,
  OrderSource,
} from "@/components/orderIntelligence/orderIntelligenceTypes";

export type CheckoutOrderBridgeInput = {
  orderId: string;
  payload: CheckoutOrderPayload;
  totalPriceRub: number;
  paymentMethodLabel: string;
  cardMessage?: string;
  source?: OrderSource;
  sizeByProductId?: Partial<Record<string, CatalogProductSizeId>>;
  addOnIdsByProductId?: Partial<Record<string, string[]>>;
  inventoryReservationId?: string | null;
  inventoryPlan?: OrderInventoryIntegrationPlan;
};

function calculateProductsTotal(items: OrderItem[]): number {
  return items.reduce((total, item) => total + item.lineTotalRub, 0);
}

export function buildOrderFromCheckoutInput(
  input: CheckoutOrderBridgeInput,
): Order {
  const now = new Date().toISOString();
  const deliveryPriceRub = input.payload.deliveryZonePriceRub ?? 0;
  const items: OrderItem[] = input.payload.items.map((item) => ({
    productId: item.bouquetId,
    title: item.title,
    sizeId: input.sizeByProductId?.[item.bouquetId] ?? "S",
    quantity: item.quantity,
    unitPriceRub: item.priceRub,
    lineTotalRub: item.priceRub * item.quantity,
    addOnIds: input.addOnIdsByProductId?.[item.bouquetId] ?? [],
  }));
  const productsRub = calculateProductsTotal(items);

  return {
    id: input.orderId,
    status: "new",
    customer: {
      name: input.payload.customerName,
      phone: input.payload.phone,
      email: null,
    },
    recipient: {
      name: input.payload.customerName,
      phone: input.payload.phone,
      isSameAsCustomer: true,
    },
    delivery: {
      address: input.payload.deliveryAddress,
      latitude: input.payload.addressLatitude ?? null,
      longitude: input.payload.addressLongitude ?? null,
      zoneId: input.payload.deliveryZoneId ?? null,
      zoneLabel: input.payload.deliveryZoneLabel ?? null,
      zoneTitle: input.payload.deliveryZoneTitle ?? null,
      deliveryPriceRub,
      deliveryDate: input.payload.deliveryDate,
      deliveryInterval: input.payload.deliveryInterval,
      comment: input.payload.comment,
      cardMessage: input.cardMessage?.trim() || undefined,
      deliveryEta: input.payload.deliveryZoneRoadDurationMinutes
        ? `${input.payload.deliveryZoneRoadDurationMinutes} мин`
        : null,
      courierId: null,
      courierName: null,
      courierPhone: null,
      assignedAt: null,
    },
    payment: {
      method: input.paymentMethodLabel,
      status: "pending",
      totalRub: input.totalPriceRub,
      productsRub,
      deliveryRub: deliveryPriceRub,
      proofFileName: null,
    },
    items,
    timeline: [],
    inventoryReservationId: input.inventoryReservationId ?? null,
    source: input.source ?? "checkout",
    createdAt: now,
    updatedAt: now,
    confirmedAt: null,
    deliveredAt: null,
    cancelledAt: null,
    notes: [],
  };
}

export function persistOrderIntelligenceFromCheckout(
  input: CheckoutOrderBridgeInput,
): Order {
  const order = buildOrderFromCheckoutInput(input);
  const created = createOrder(order);
  return handleOrderInventoryOnCreate(created, input.inventoryPlan);
}

export function getExampleOrderPayload(): Order {
  return buildOrderFromCheckoutInput({
    orderId: "BF-1001",
    totalPriceRub: 16790,
    paymentMethodLabel: "Перевод на карту",
    cardMessage: "С днём рождения!",
    payload: {
      items: [
        {
          bouquetId: "white-pearl",
          title: "White Pearl",
          sizeId: "S",
          sizeLabel: "S",
          priceRub: 24900,
          quantity: 1,
        },
      ],
      customerName: "Анна Иванова",
      phone: "+7 900 123-45-67",
      deliveryAddress: "Москва, ул. Тверская, 12",
      deliveryDate: "2026-06-25",
      deliveryInterval: "14:00–16:00",
      comment: "Позвонить за 30 минут",
      deliveryZoneId: "zone-b",
      deliveryZoneLabel: "Зона B",
      deliveryZoneTitle: "Центр",
      deliveryZonePriceRub: 1890,
      addressLatitude: 55.757,
      addressLongitude: 37.615,
    },
    sizeByProductId: {
      "white-pearl": "S",
    },
    addOnIdsByProductId: {
      "white-pearl": ["greeting-card"],
    },
    inventoryReservationId: "BF-1001",
  });
}
