import { expect, test } from "@playwright/test";
import { buildCheckoutOrderPayload } from "../../components/checkout/buildCheckoutOrderPayload";
import type { CheckoutForm } from "../../components/checkout/checkoutTypes";
import type { DeliveryConfidenceResult } from "../../components/deliveryConfidence/deliveryConfidenceTypes";
import type { DeliveryValidationResult } from "../../components/deliveryValidation/deliveryValidationTypes";
import type { DeliveryPriceResult } from "../../components/deliveryZones/deliveryPriceTypes";
import type { RealDeliveryZoneResult } from "../../components/deliveryZones/realDeliveryZoneTypes";
import {
  addStorefrontCartLine,
  cartLineTotal,
  decreaseStorefrontCartLine,
  increaseStorefrontCartLine,
  removeStorefrontCartLine,
} from "../../lib/storefront/cartLines";

const readyForm: CheckoutForm = {
  name: "Анна",
  phone: "+7 999 111-22-33",
  recipientIsCustomer: true,
  recipientName: "",
  recipientPhone: "",
  anonymousDelivery: false,
  doNotCallRecipient: false,
  photoBeforeDelivery: false,
  legalAccepted: true,
  address: "Москва, Тверская улица, 1",
  deliveryDate: "2026-10-09",
  deliveryTime: "12:00–15:00",
  cardMessage: "",
  comment: "",
};

const deliveryPrice = {
  status: "ready",
  deliveryPriceRub: 790,
  deliveryZoneId: "base",
  deliveryZoneLabel: "Москва",
} as DeliveryPriceResult;

const realZone = {
  status: "available",
  detectionMode: "polygon",
  selectedZoneId: "base",
} as unknown as RealDeliveryZoneResult;

const deliveryValidation = {
  status: "ready",
  canSubmitCheckout: true,
  validationWarnings: [],
  validationErrors: [],
} as unknown as DeliveryValidationResult;

test("keeps separate bouquet sizes and sends every remaining line to checkout", () => {
  let items = addStorefrontCartLine([], {
    bouquetId: "bouquet-a",
    sizeId: "M",
    priceRub: 2500,
  }).items;
  items = addStorefrontCartLine(items, {
    bouquetId: "bouquet-b",
    sizeId: "L",
    priceRub: 4900,
  }).items;
  const repeated = addStorefrontCartLine(items, {
    bouquetId: "bouquet-a",
    sizeId: "M",
    priceRub: 2500,
  });

  expect(repeated.status).toBe("incremented");
  expect(repeated.items).toEqual([
    { bouquetId: "bouquet-a", sizeId: "M", quantity: 2, priceRub: 2500 },
    { bouquetId: "bouquet-b", sizeId: "L", quantity: 1, priceRub: 4900 },
  ]);
  expect(cartLineTotal(repeated.items)).toBe(2500 * 2 + 4900);

  const otherSize = addStorefrontCartLine(repeated.items, {
    bouquetId: "bouquet-a",
    sizeId: "L",
    priceRub: 3900,
  });
  expect(otherSize.items).toHaveLength(3);
  expect(otherSize.items[2]).toMatchObject({
    bouquetId: "bouquet-a",
    sizeId: "L",
    quantity: 1,
    priceRub: 3900,
  });

  const increased = increaseStorefrontCartLine(
    repeated.items,
    "bouquet-b",
    "L",
  );
  expect(increased.items[1]?.quantity).toBe(2);

  const decreased = decreaseStorefrontCartLine(
    increased.items,
    "bouquet-a",
    "M",
  );
  expect(decreased.status).toBe("decreased");
  expect(decreased.items[0]?.quantity).toBe(1);

  const withoutSecondLine = removeStorefrontCartLine(
    decreased.items,
    "bouquet-b",
    "L",
  );
  expect(withoutSecondLine.items).toEqual([
    { bouquetId: "bouquet-a", sizeId: "M", quantity: 1, priceRub: 2500 },
  ]);

  const emptied = decreaseStorefrontCartLine(
    withoutSecondLine.items,
    "bouquet-a",
    "M",
  );
  expect(emptied.status).toBe("removed");
  expect(emptied.items).toEqual([]);

  const payload = buildCheckoutOrderPayload(
    readyForm,
    [
      {
        bouquet: { id: "bouquet-a", title: "Букет A", priceRub: 2500 },
        sizeId: "M",
        sizeLabel: "M",
        quantity: 1,
      },
      {
        bouquet: { id: "bouquet-b", title: "Букет B", priceRub: 4900 },
        sizeId: "L",
        sizeLabel: "L",
        quantity: 2,
      },
    ],
    new Date("2026-10-08T09:00:00+03:00"),
    deliveryPrice,
    realZone,
    deliveryValidation,
    { engineEnabled: false } as DeliveryConfidenceResult,
  );

  expect(payload?.items).toEqual([
    {
      bouquetId: "bouquet-a",
      title: "Букет A",
      sizeId: "M",
      sizeLabel: "M",
      priceRub: 2500,
      quantity: 1,
    },
    {
      bouquetId: "bouquet-b",
      title: "Букет B",
      sizeId: "L",
      sizeLabel: "L",
      priceRub: 4900,
      quantity: 2,
    },
  ]);
});
