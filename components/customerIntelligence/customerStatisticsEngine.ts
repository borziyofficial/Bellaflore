// ==================================================
// SECTION: CUSTOMER INTELLIGENCE
// РАЗДЕЛ: Statistics engine
// ==================================================
import type {
  CustomerProfile,
  CustomerStatistics,
} from "@/components/customerIntelligence/customerIntelligenceTypes";

function daysBetween(left: string, right: string): number {
  const diff = new Date(right).getTime() - new Date(left).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

export function calculateCustomerStatistics(
  profile: CustomerProfile,
): CustomerStatistics {
  const entries = profile.history.entries;
  const delivered = entries.filter((entry) => entry.status === "delivered");
  const cancelled = entries.filter((entry) => entry.status === "cancelled");

  const revenueEntries = delivered.length > 0 ? delivered : entries;
  const totalRevenue = revenueEntries.reduce((sum, entry) => sum + entry.totalRub, 0);
  const averageOrderValue =
    revenueEntries.length > 0 ? Math.round(totalRevenue / revenueEntries.length) : 0;

  const sortedDates = entries
    .map((entry) => entry.occurredAt)
    .sort((left, right) => new Date(left).getTime() - new Date(right).getTime());

  const firstOrderDate = sortedDates[0] ?? null;
  const lastOrderDate = sortedDates[sortedDates.length - 1] ?? null;

  let orderFrequencyDays: number | null = null;
  if (sortedDates.length >= 2) {
    orderFrequencyDays = Math.round(
      daysBetween(sortedDates[0], sortedDates[sortedDates.length - 1]) /
        (sortedDates.length - 1),
    );
  }

  const repeatPurchaseScore =
    entries.length >= 3
      ? 90
      : entries.length === 2
        ? 65
        : entries.length === 1
          ? 35
          : 0;

  return {
    totalOrders: entries.length,
    deliveredOrders: delivered.length,
    cancelledOrders: cancelled.length,
    averageOrderValue,
    totalRevenue,
    lastOrderDate,
    firstOrderDate,
    orderFrequencyDays,
    favoriteCategory: profile.preferences.favoriteCategories[0] ?? null,
    favoriteFlower: profile.preferences.favoriteFlowers[0] ?? null,
    repeatPurchaseScore,
    calculatedAt: new Date().toISOString(),
  };
}
