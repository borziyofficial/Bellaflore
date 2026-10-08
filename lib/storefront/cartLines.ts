import type { ProductSizeId } from "@/components/product/productExperienceTypes";

export const MAX_CART_ITEM_QUANTITY = 20;
export const MAX_CART_TOTAL_QUANTITY = 50;

export type StorefrontCartLine = {
  bouquetId: string;
  quantity: number;
  sizeId: ProductSizeId;
  priceRub: number;
};

export type CartLineStatus =
  | "added"
  | "incremented"
  | "item-limit"
  | "total-limit"
  | "decreased"
  | "removed"
  | "unchanged";

type CartLineMutation = {
  items: StorefrontCartLine[];
  status: CartLineStatus;
};

function isSameLine(
  item: StorefrontCartLine,
  bouquetId: string,
  sizeId: ProductSizeId,
) {
  return item.bouquetId === bouquetId && item.sizeId === sizeId;
}

function totalQuantity(items: StorefrontCartLine[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function addStorefrontCartLine(
  items: StorefrontCartLine[],
  line: Omit<StorefrontCartLine, "quantity">,
): CartLineMutation {
  if (totalQuantity(items) >= MAX_CART_TOTAL_QUANTITY) {
    return { items, status: "total-limit" };
  }

  const existing = items.find((item) =>
    isSameLine(item, line.bouquetId, line.sizeId),
  );

  if (!existing) {
    return {
      items: [...items, { ...line, quantity: 1 }],
      status: "added",
    };
  }

  if (existing.quantity >= MAX_CART_ITEM_QUANTITY) {
    return { items, status: "item-limit" };
  }

  return {
    items: items.map((item) =>
      isSameLine(item, line.bouquetId, line.sizeId)
        ? {
            ...item,
            quantity: item.quantity + 1,
            priceRub: line.priceRub,
          }
        : item,
    ),
    status: "incremented",
  };
}

export function removeStorefrontCartLine(
  items: StorefrontCartLine[],
  bouquetId: string,
  sizeId: ProductSizeId,
): CartLineMutation {
  const nextItems = items.filter(
    (item) => !isSameLine(item, bouquetId, sizeId),
  );

  return {
    items: nextItems,
    status: nextItems.length === items.length ? "unchanged" : "removed",
  };
}

export function decreaseStorefrontCartLine(
  items: StorefrontCartLine[],
  bouquetId: string,
  sizeId: ProductSizeId,
): CartLineMutation {
  let status: CartLineStatus = "unchanged";
  const nextItems = items.flatMap((item) => {
    if (!isSameLine(item, bouquetId, sizeId)) {
      return [item];
    }

    if (item.quantity <= 1) {
      status = "removed";
      return [];
    }

    status = "decreased";
    return [{ ...item, quantity: item.quantity - 1 }];
  });

  return { items: nextItems, status };
}

export function increaseStorefrontCartLine(
  items: StorefrontCartLine[],
  bouquetId: string,
  sizeId: ProductSizeId,
): CartLineMutation {
  if (totalQuantity(items) >= MAX_CART_TOTAL_QUANTITY) {
    return { items, status: "total-limit" };
  }

  let status: CartLineStatus = "unchanged";
  const nextItems = items.map((item) => {
    if (!isSameLine(item, bouquetId, sizeId)) {
      return item;
    }

    if (item.quantity >= MAX_CART_ITEM_QUANTITY) {
      status = "item-limit";
      return item;
    }

    status = "incremented";
    return { ...item, quantity: item.quantity + 1 };
  });

  return { items: nextItems, status };
}

export function cartLineTotal(items: StorefrontCartLine[]) {
  return items.reduce((total, item) => total + item.priceRub * item.quantity, 0);
}
