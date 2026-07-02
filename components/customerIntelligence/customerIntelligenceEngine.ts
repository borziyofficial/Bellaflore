// ==================================================
// SECTION: CUSTOMER INTELLIGENCE
// РАЗДЕЛ: Core engine
// ==================================================
import { buildAnalyticsCustomerInsight } from "@/components/customerIntelligence/analyticsCustomerBridge";
import { buildDeliveryCustomerInsight } from "@/components/customerIntelligence/deliveryCustomerBridge";
import { buildNotificationCustomerInsight } from "@/components/customerIntelligence/notificationCustomerBridge";
import { buildOrderCustomerInsight } from "@/components/customerIntelligence/orderCustomerBridge";
import { buildPromotionCustomerInsight } from "@/components/customerIntelligence/promotionCustomerBridge";
import { readAnalyticsCustomerSnapshot } from "@/components/customerIntelligence/analyticsCustomerBridge";
import { readDeliveryCustomerSnapshot } from "@/components/customerIntelligence/deliveryCustomerBridge";
import { readNotificationCustomerSnapshot } from "@/components/customerIntelligence/notificationCustomerBridge";
import { readOrderCustomerSnapshot } from "@/components/customerIntelligence/orderCustomerBridge";
import { readPromotionCustomerSnapshot } from "@/components/customerIntelligence/promotionCustomerBridge";
import { syncCustomerHistory } from "@/components/customerIntelligence/customerHistoryEngine";
import { calculateCustomerLifetimeValue } from "@/components/customerIntelligence/customerLifetimeValueEngine";
import { calculateCustomerRiskScore } from "@/components/customerIntelligence/customerRiskEngine";
import { detectCustomerSegment } from "@/components/customerIntelligence/customerSegmentEngine";
import { calculateCustomerStatistics } from "@/components/customerIntelligence/customerStatisticsEngine";
import {
  CUSTOMER_INTELLIGENCE_SEED,
} from "@/components/customerIntelligence/customerCatalogSeed";
import {
  getCustomerProfile,
  listCustomerProfiles,
  saveCustomerProfileState,
  seedCustomerIntelligenceStore,
} from "@/components/customerIntelligence/customerProfileEngine";
import type { CustomerProfile } from "@/components/customerIntelligence/customerIntelligenceTypes";

export type CustomerIntelligenceSnapshot = {
  customerId: string;
  profile: CustomerProfile;
  bridges: {
    orders: ReturnType<typeof readOrderCustomerSnapshot>;
    notifications: ReturnType<typeof readNotificationCustomerSnapshot>;
    analytics: ReturnType<typeof readAnalyticsCustomerSnapshot>;
    promotions: ReturnType<typeof readPromotionCustomerSnapshot>;
    delivery: ReturnType<typeof readDeliveryCustomerSnapshot>;
  };
  insights: {
    orders: ReturnType<typeof buildOrderCustomerInsight>;
    notifications: ReturnType<typeof buildNotificationCustomerInsight>;
    analytics: ReturnType<typeof buildAnalyticsCustomerInsight>;
    promotions: ReturnType<typeof buildPromotionCustomerInsight>;
    delivery: ReturnType<typeof buildDeliveryCustomerInsight>;
  };
  generatedAt: string;
};

export function recalculateCustomerProfile(
  customerId: string,
): CustomerProfile | null {
  const synced = syncCustomerHistory(customerId);
  if (!synced) {
    return null;
  }

  const statistics = calculateCustomerStatistics(synced);
  const lifetimeValue = calculateCustomerLifetimeValue(synced, statistics);
  const riskScore = calculateCustomerRiskScore(synced, statistics);

  const draft: CustomerProfile = {
    ...synced,
    statistics,
    lifetimeValue,
    riskScore,
  };

  const segment = detectCustomerSegment(draft, statistics);

  return saveCustomerProfileState({
    ...draft,
    segment,
  });
}

export function recalculateAllCustomerProfiles(): CustomerProfile[] {
  return listCustomerProfiles()
    .map((profile) => recalculateCustomerProfile(profile.id))
    .filter(Boolean) as CustomerProfile[];
}

export function buildCustomerIntelligenceSnapshot(
  customerId: string,
): CustomerIntelligenceSnapshot | null {
  const profile = getCustomerProfile(customerId);
  if (!profile) {
    return null;
  }

  return {
    customerId,
    profile,
    bridges: {
      orders: readOrderCustomerSnapshot(customerId),
      notifications: readNotificationCustomerSnapshot(customerId),
      analytics: readAnalyticsCustomerSnapshot(customerId),
      promotions: readPromotionCustomerSnapshot(customerId),
      delivery: readDeliveryCustomerSnapshot(customerId),
    },
    insights: {
      orders: buildOrderCustomerInsight(customerId),
      notifications: buildNotificationCustomerInsight(customerId),
      analytics: buildAnalyticsCustomerInsight(customerId),
      promotions: buildPromotionCustomerInsight(customerId),
      delivery: buildDeliveryCustomerInsight(customerId),
    },
    generatedAt: new Date().toISOString(),
  };
}

export function getCustomerIntelligenceExample(): CustomerProfile {
  return CUSTOMER_INTELLIGENCE_SEED[0];
}

export function initializeCustomerIntelligence(): CustomerProfile[] {
  return seedCustomerIntelligenceStore();
}

export const CUSTOMER_INTELLIGENCE_ENGINE_SCHEMA = {
  module: "customerIntelligence",
  storageKey: "bellaflore_customer_intelligence_v1",
  layers: [
    {
      id: "types",
      files: ["customerIntelligenceTypes.ts", "customerCatalogSeed.ts"],
    },
    {
      id: "profile",
      engines: [
        "customerProfileEngine",
        "customerHistoryEngine",
        "customerPreferenceEngine",
        "customerOccasionEngine",
        "customerReminderEngine",
      ],
    },
    {
      id: "analytics",
      engines: [
        "customerStatisticsEngine",
        "customerLifetimeValueEngine",
        "customerRiskEngine",
        "customerSegmentEngine",
      ],
    },
    {
      id: "bridges",
      bridges: [
        "orderCustomerBridge",
        "notificationCustomerBridge",
        "analyticsCustomerBridge",
        "promotionCustomerBridge",
        "deliveryCustomerBridge",
      ],
      mode: "read_only",
    },
    {
      id: "admin",
      foundation: "customerAdminFoundation",
    },
    {
      id: "ai",
      foundation: "aiCustomerFoundation",
      externalApi: false,
    },
    {
      id: "public",
      foundation: "customerPublicFoundation",
      routesConnected: false,
    },
    {
      id: "orchestrator",
      engine: "customerIntelligenceEngine",
      pipeline: [
        "syncCustomerHistory",
        "calculateCustomerStatistics",
        "calculateCustomerLifetimeValue",
        "calculateCustomerRiskScore",
        "detectCustomerSegment",
        "saveCustomerProfileState",
      ],
    },
  ],
} as const;
