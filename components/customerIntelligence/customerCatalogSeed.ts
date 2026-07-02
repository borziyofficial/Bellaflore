// ==================================================
// SECTION: CUSTOMER INTELLIGENCE
// РАЗДЕЛ: Seed catalog
// ==================================================
import type { CustomerProfile } from "@/components/customerIntelligence/customerIntelligenceTypes";

export const DEFAULT_CUSTOMER_PREFERENCES: CustomerProfile["preferences"] = {
  favoriteFlowers: [],
  favoriteColors: [],
  favoriteBouquetStyles: [],
  favoriteCategories: [],
  preferredDeliveryZones: [],
  preferredDeliveryTimes: [],
  preferredAddOns: [],
  dislikedFlowers: [],
  dislikedColors: [],
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_CUSTOMER_STATISTICS: CustomerProfile["statistics"] = {
  totalOrders: 0,
  deliveredOrders: 0,
  cancelledOrders: 0,
  averageOrderValue: 0,
  totalRevenue: 0,
  lastOrderDate: null,
  firstOrderDate: null,
  orderFrequencyDays: null,
  favoriteCategory: null,
  favoriteFlower: null,
  repeatPurchaseScore: 0,
  calculatedAt: new Date().toISOString(),
};

export const DEFAULT_CUSTOMER_LTV: CustomerProfile["lifetimeValue"] = {
  totalRevenue: 0,
  projectedAnnualValue: 0,
  orderCount: 0,
  averageOrderValue: 0,
  loyaltyMultiplier: 1,
  score: 0,
  tier: "bronze",
  calculatedAt: new Date().toISOString(),
};

export const DEFAULT_CUSTOMER_RISK: CustomerProfile["riskScore"] = {
  score: 0,
  level: "low",
  reasons: [],
  calculatedAt: new Date().toISOString(),
};

export function buildEmptyCustomerProfile(
  input: Pick<CustomerProfile, "id" | "fullName" | "phone"> & {
    email?: string | null;
  },
): CustomerProfile {
  const now = new Date().toISOString();

  return {
    id: input.id,
    fullName: input.fullName,
    phone: input.phone,
    email: input.email ?? null,
    addresses: [],
    recipients: [],
    favorites: [],
    preferences: { ...DEFAULT_CUSTOMER_PREFERENCES, updatedAt: now },
    occasions: [],
    history: { entries: [], syncedAt: null },
    statistics: { ...DEFAULT_CUSTOMER_STATISTICS, calculatedAt: now },
    lifetimeValue: { ...DEFAULT_CUSTOMER_LTV, calculatedAt: now },
    riskScore: { ...DEFAULT_CUSTOMER_RISK, calculatedAt: now },
    segment: "new_customer",
    vipLevel: 0,
    reminders: [],
    tags: [],
    notes: [],
    communicationHistory: [],
    createdAt: now,
    updatedAt: now,
  };
}

export const CUSTOMER_INTELLIGENCE_SEED: CustomerProfile[] = [
  {
    ...buildEmptyCustomerProfile({
      id: "customer-anna-ivanova",
      fullName: "Анна Иванова",
      phone: "+7 999 111-22-33",
      email: "anna@example.com",
    }),
    tags: ["loyal", "gift_buyer"],
    vipLevel: 2,
    segment: "vip_customer",
    preferences: {
      favoriteFlowers: ["rose", "peony"],
      favoriteColors: ["pink", "white"],
      favoriteBouquetStyles: ["classic", "premium"],
      favoriteCategories: ["bouquets", "premium"],
      preferredDeliveryZones: ["base", "7km"],
      preferredDeliveryTimes: ["10:00-14:00", "14:00-18:00"],
      preferredAddOns: ["greeting-card", "vase"],
      dislikedFlowers: ["chrysanthemum"],
      dislikedColors: ["yellow"],
      updatedAt: new Date().toISOString(),
    },
    occasions: [
      {
        id: "occasion-anna-birthday",
        kind: "birthday",
        title: "День рождения мамы",
        date: "1990-05-12",
        recipientName: "Мама",
        notes: "Любит пионы",
        createdAt: new Date().toISOString(),
      },
    ],
  },
];
