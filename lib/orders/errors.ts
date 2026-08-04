export type OrderErrorCode =
  | "INVALID_JSON"
  | "INVALID_REQUEST"
  | "INVALID_IDEMPOTENCY_KEY"
  | "PRODUCT_NOT_FOUND"
  | "PRODUCT_UNAVAILABLE"
  | "SIZE_UNAVAILABLE"
  | "DELIVERY_OUTSIDE_AREA"
  | "IDEMPOTENCY_CONFLICT"
  | "ORDER_STORAGE_NOT_READY"
  | "ORDER_STORAGE_ERROR"
  | "ORDER_LOOKUP_INVALID"
  | "ORDER_NOT_FOUND";

export class OrderError extends Error {
  constructor(
    public readonly code: OrderErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "OrderError";
  }
}
