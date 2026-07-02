// ==================================================
// SECTION: INVENTORY INTELLIGENCE
// РАЗДЕЛ: Reservation foundation (in-memory)
// ==================================================
import {
  getProductComposition,
  resolveRequirementQuantity,
} from "@/components/inventoryIntelligence/productCompositionCatalog";
import type { CatalogProductSizeId } from "@/components/catalogEngine/catalogTypes";
import type {
  StockReservation,
  StockReservationLine,
} from "@/components/inventoryIntelligence/inventoryIntelligenceTypes";

type ReservationItemInput = {
  productId: string;
  sizeId?: CatalogProductSizeId;
  quantity?: number;
  addOnIds?: string[];
};

type MutableStockState = {
  quantity: number;
  reservedQuantity: number;
};

const reservationStore = new Map<string, StockReservation>();
const stockStateStore = new Map<string, MutableStockState>();

export function seedInventoryReservationStock(
  items: Array<{ id: string; quantity: number; reservedQuantity?: number }>,
): void {
  stockStateStore.clear();

  for (const item of items) {
    stockStateStore.set(item.id, {
      quantity: item.quantity,
      reservedQuantity: item.reservedQuantity ?? 0,
    });
  }
}

export function readReservationStockState(): Map<string, MutableStockState> {
  return new Map(stockStateStore);
}

function buildReservationLines(
  input: ReservationItemInput,
): StockReservationLine[] {
  const sizeId = input.sizeId ?? "S";
  const quantityMultiplier = input.quantity ?? 1;
  const lines: StockReservationLine[] = [];

  const composition = getProductComposition(input.productId);
  if (composition) {
    for (const requirement of composition.requirements) {
      const perUnit = resolveRequirementQuantity(requirement, sizeId);
      lines.push({
        stockItemId: requirement.stockItemId,
        quantity: perUnit * quantityMultiplier,
      });
    }
  }

  for (const addOnId of input.addOnIds ?? []) {
    lines.push({
      stockItemId: addOnId,
      quantity: 1 * quantityMultiplier,
    });
  }

  return lines;
}

function mergeReservationLines(
  lines: StockReservationLine[],
): StockReservationLine[] {
  const merged = new Map<string, number>();

  for (const line of lines) {
    merged.set(
      line.stockItemId,
      (merged.get(line.stockItemId) ?? 0) + line.quantity,
    );
  }

  return [...merged.entries()].map(([stockItemId, quantity]) => ({
    stockItemId,
    quantity,
  }));
}

function ensureStockState(stockItemId: string): MutableStockState {
  const existing = stockStateStore.get(stockItemId);
  if (existing) {
    return existing;
  }

  const created = { quantity: 0, reservedQuantity: 0 };
  stockStateStore.set(stockItemId, created);
  return created;
}

export function reserveStockForOrder(
  orderId: string,
  items: ReservationItemInput[],
): StockReservation {
  releaseStockReservation(orderId);

  const reservationLines = mergeReservationLines(
    items.flatMap((item) => buildReservationLines(item)),
  );

  for (const line of reservationLines) {
    const state = ensureStockState(line.stockItemId);
    const available = state.quantity - state.reservedQuantity;

    if (available < line.quantity) {
      releaseStockReservation(orderId);
      throw new Error(
        `Insufficient stock for ${line.stockItemId}: need ${line.quantity}, available ${available}`,
      );
    }

    state.reservedQuantity += line.quantity;
  }

  const reservation: StockReservation = {
    orderId,
    items: reservationLines,
    status: "reserved",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  reservationStore.set(orderId, reservation);
  return reservation;
}

export function releaseStockReservation(orderId: string): StockReservation | null {
  const existing = reservationStore.get(orderId);
  if (!existing || existing.status === "released") {
    return existing ?? null;
  }

  for (const line of existing.items) {
    const state = ensureStockState(line.stockItemId);
    state.reservedQuantity = Math.max(0, state.reservedQuantity - line.quantity);
  }

  const released: StockReservation = {
    ...existing,
    status: "released",
    updatedAt: new Date().toISOString(),
  };

  reservationStore.set(orderId, released);
  return released;
}

export function confirmStockUsage(orderId: string): StockReservation | null {
  const existing = reservationStore.get(orderId);
  if (!existing || existing.status !== "reserved") {
    return existing ?? null;
  }

  for (const line of existing.items) {
    const state = ensureStockState(line.stockItemId);
    state.quantity = Math.max(0, state.quantity - line.quantity);
    state.reservedQuantity = Math.max(0, state.reservedQuantity - line.quantity);
  }

  const confirmed: StockReservation = {
    ...existing,
    status: "confirmed",
    updatedAt: new Date().toISOString(),
  };

  reservationStore.set(orderId, confirmed);
  return confirmed;
}

export function getStockReservation(orderId: string): StockReservation | null {
  return reservationStore.get(orderId) ?? null;
}

export function listStockReservations(): StockReservation[] {
  return [...reservationStore.values()];
}

export function clearInventoryReservations(): void {
  reservationStore.clear();
  stockStateStore.clear();
}
