import type { CreateOrderItemInput, OrderPaymentMethod } from "@/lib/orders/types";

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
  deliveryInterval?: string;
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

export interface OrderDraftRepository {
  findById(draftId: string): Promise<OrderDraft | null>;
  findByCustomerPhone(phone: string, limit?: number): Promise<OrderDraft[]>;
  create(draft: Omit<OrderDraft, "id" | "createdAt" | "updatedAt">): Promise<OrderDraft>;
  update(draftId: string, updates: UpdateOrderDraftInput): Promise<OrderDraft | null>;
  delete(draftId: string): Promise<boolean>;
  markAsConverted(draftId: string, orderId: string): Promise<OrderDraft | null>;
  markAsAbandoned(draftId: string): Promise<OrderDraft | null>;
}
