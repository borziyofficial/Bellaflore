// ==================================================
// SECTION: AI BRAIN
// РАЗДЕЛ: Order bridge (read-only)
// ==================================================
import { buildAdminOrderSummary } from "@/components/adminIntelligence/adminOrderBridge";
import { listOrders } from "@/components/orderIntelligence/orderStoreEngine";

export type AiOrderBridgeSnapshot = {
  summary: ReturnType<typeof buildAdminOrderSummary>;
  unconfirmedOrderIds: string[];
  recentOrderIds: string[];
  generatedAt: string;
};

export function readAiOrderSnapshot(): AiOrderBridgeSnapshot {
  const orders = listOrders();
  const summary = buildAdminOrderSummary(5);

  return {
    summary,
    unconfirmedOrderIds: orders
      .filter((order) => order.status === "new")
      .map((order) => order.id),
    recentOrderIds: orders
      .slice()
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )
      .slice(0, 10)
      .map((order) => order.id),
    generatedAt: new Date().toISOString(),
  };
}
