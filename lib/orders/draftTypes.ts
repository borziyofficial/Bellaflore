import type { CreateOrderItemInput, DeliveryMode, OrderPaymentMethod } from "@/lib/orders/types";

export type ConversationStateTurn = {
  turn: number;
  timestamp: string;
  userMessage?: string;
  aiReply?: string;
  recommendedProductIds?: string[];
  selectedProductId?: string;
};

export type OrderDraftConversationState = {
  turns: ConversationStateTurn[];
  budget?: number;
  recipientType?: string;
  occasion?: string;
  colorPreference?: string;
  excludedFlowers?: string[];
  selectedProductId?: string;
};

export type DraftOrderItem = {
  productId: string;
  size: "S" | "M" | "L" | "XL";
  quantity: number;
};

export type OrderDraft = {
  id: string;
  customerName?: string;
  customerPhone?: string;
  recipientName?: string;
  recipientPhone?: string;
  customerComment?: string;
  deliveryAddress?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  deliveryZoneId?: string;
  deliveryDate?: string;
  deliveryInterval: string | null;
  deliveryMode: DeliveryMode | null;
  deliveryExactTime: string | null;
  deliveryTimeSurcharge: number;
  paymentMethod?: OrderPaymentMethod;
  items: DraftOrderItem[];
  conversationState: OrderDraftConversationState;
  status: "active" | "abandoned" | "converted";
  convertedToOrderId?: string;
  createdAt: string;
  updatedAt: string;
  abandonedAt?: string;
};

export type UpdateOrderDraftInput = Partial<Omit<OrderDraft, "id" | "status" | "createdAt">>;

export type DraftDeliveryTimeState = {
  deliveryMode: DeliveryMode | null;
  deliveryInterval: string | null;
  deliveryExactTime: string | null;
  deliveryTimeSurcharge: number;
};

export function createEmptyOrderDraft(customerPhone?: string): Omit<OrderDraft, "id" | "createdAt" | "updatedAt"> {
  return {
    customerPhone,
    deliveryInterval: null,
    deliveryMode: null,
    deliveryExactTime: null,
    deliveryTimeSurcharge: 0,
    conversationState: { turns: [] },
    items: [],
    status: "active",
  };
}

export function resolveDraftDeliveryTime(
  current: Pick<OrderDraft, "deliveryMode" | "deliveryInterval" | "deliveryExactTime" | "deliveryTimeSurcharge">,
  updates: UpdateOrderDraftInput,
): DraftDeliveryTimeState {
  const currentMode = current.deliveryMode ??
    (current.deliveryInterval ? "interval" : current.deliveryExactTime ? "exact" : null);
  const deliveryMode = updates.deliveryMode !== undefined
    ? updates.deliveryMode
    : updates.deliveryExactTime !== undefined
      ? "exact"
      : updates.deliveryInterval !== undefined
        ? "interval"
        : currentMode;

  if (deliveryMode === null) {
    return { deliveryMode: null, deliveryInterval: null, deliveryExactTime: null, deliveryTimeSurcharge: 0 };
  }
  if (deliveryMode === "interval") {
    return {
      deliveryMode,
      deliveryInterval: updates.deliveryInterval ?? current.deliveryInterval ?? null,
      deliveryExactTime: null,
      deliveryTimeSurcharge: 0,
    };
  }
  return {
    deliveryMode,
    deliveryInterval: null,
    deliveryExactTime: updates.deliveryExactTime ?? current.deliveryExactTime ?? null,
    deliveryTimeSurcharge: updates.deliveryTimeSurcharge ?? current.deliveryTimeSurcharge ?? 0,
  };
}

export function hasCompleteDraftDeliveryTime(
  draft: Pick<OrderDraft, "deliveryMode" | "deliveryInterval" | "deliveryExactTime">,
): boolean {
  if (draft.deliveryMode === "interval") {
    return Boolean(draft.deliveryInterval?.trim()) && !draft.deliveryExactTime;
  }
  if (draft.deliveryMode === "exact") {
    return Boolean(draft.deliveryExactTime?.trim()) && !draft.deliveryInterval;
  }
  return false;
}

export interface OrderDraftRepository {
  findById(draftId: string): Promise<OrderDraft | null>;
  findByCustomerPhone(phone: string, limit?: number): Promise<OrderDraft[]>;
  create(draft: Omit<OrderDraft, "id" | "createdAt" | "updatedAt">): Promise<OrderDraft>;
  update(draftId: string, updates: UpdateOrderDraftInput): Promise<OrderDraft | null>;
  delete(draftId: string): Promise<boolean>;
  markAsConverted(draftId: string, orderId: string): Promise<OrderDraft | null>;
  markAsAbandoned(draftId: string): Promise<OrderDraft | null>;
}
