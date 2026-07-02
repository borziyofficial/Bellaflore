// ==================================================
// SECTION: CRM INTELLIGENCE
// РАЗДЕЛ: Core engine
// ==================================================
import { buildCrmExampleRegistryState } from "@/components/crmIntelligence/crmExamples";
import {
  buildCustomerTimeline,
  listCrmInsights,
  listCrmReminders,
  listCustomerNotes,
  listPurchaseHistory,
  listReminderQueue,
  seedCrmHistoryRegistry,
} from "@/components/crmIntelligence/customerHistory";
import {
  listCrmCustomers,
  listRepeatCustomers,
  listVipCustomers,
  seedCrmCustomerRegistry,
} from "@/components/crmIntelligence/customerRegistry";
import {
  calculateCustomerLifetimeValue,
  filterCustomersBySegment,
  listAtRiskCustomers,
  listHighValueCustomers,
} from "@/components/crmIntelligence/customerSegments";
import {
  listAiCrmPreparations,
  listCustomerTagAssignments,
  seedCrmTagsRegistry,
} from "@/components/crmIntelligence/customerTags";
import type {
  CrmCustomerSegment,
  CrmIntelligenceSnapshot,
  CrmReadOnlySummary,
  CrmStatistics,
} from "@/components/crmIntelligence/crmTypes";

export const CRM_INTELLIGENCE_STORAGE_KEY =
  "bellaflore_crm_intelligence_v1";

export function calculateCrmStatistics(): CrmStatistics {
  const customers = listCrmCustomers();
  const vip = listVipCustomers();
  const repeat = listRepeatCustomers();
  const atRisk = listAtRiskCustomers();

  const ltvValues = customers
    .map((c) => calculateCustomerLifetimeValue(c.id))
    .filter(Boolean);

  const averageLifetimeValue =
    ltvValues.length > 0
      ? Math.round(
          ltvValues.reduce((sum, ltv) => sum + (ltv?.score ?? 0), 0) / ltvValues.length,
        )
      : 0;

  const averageOrdersPerCustomer =
    customers.length > 0
      ? Math.round(
          (customers.reduce((sum, c) => sum + c.totalOrders, 0) / customers.length) * 10,
        ) / 10
      : 0;

  const segmentCounts = new Map<CrmCustomerSegment, number>();
  for (const customer of customers) {
    segmentCounts.set(customer.segment, (segmentCounts.get(customer.segment) ?? 0) + 1);
  }

  const topSegment =
    [...segmentCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    totalCustomers: customers.length,
    vipCustomers: vip.length,
    repeatCustomers: repeat.length,
    atRiskCustomers: atRisk.length,
    averageLifetimeValue,
    averageOrdersPerCustomer,
    topSegment,
    pendingReminders: listCrmReminders(undefined, "pending").length,
    calculatedAt: new Date().toISOString(),
  };
}

export function buildCrmIntelligenceSnapshot(
  at: Date = new Date(),
): CrmIntelligenceSnapshot {
  return {
    customers: listCrmCustomers(),
    purchaseHistory: listPurchaseHistory(),
    timeline: listCrmCustomers().flatMap((c) => buildCustomerTimeline(c.id)),
    notes: listCustomerNotes(),
    tagAssignments: listCustomerTagAssignments(),
    reminders: listCrmReminders(),
    insights: listCrmInsights(),
    aiPreparations: listAiCrmPreparations(),
    statistics: calculateCrmStatistics(),
    generatedAt: at.toISOString(),
  };
}

export function initializeCrmIntelligence(): CrmIntelligenceSnapshot {
  seedCrmCustomerRegistry();
  seedCrmHistoryRegistry();
  seedCrmTagsRegistry();
  return buildCrmIntelligenceSnapshot();
}

export function getCrmIntelligenceExample() {
  return buildCrmExampleRegistryState().customers[0];
}

export function getCrmReadOnlySummary(): CrmReadOnlySummary {
  return {
    customerCount: listCrmCustomers().length,
    vipCount: listVipCustomers().length,
    repeatCount: listRepeatCustomers().length,
    reminderCount: listCrmReminders(undefined, "pending").length,
    insightCount: listCrmInsights().length,
  };
}

export function readCrmCustomerInsights(customerId: string) {
  const customer = listCrmCustomers().find((c) => c.id === customerId);

  return {
    customer,
    timeline: buildCustomerTimeline(customerId),
    purchaseHistory: listPurchaseHistory(customerId),
    notes: listCustomerNotes(customerId),
    tags: listCustomerTagAssignments(customerId),
    reminders: listCrmReminders(customerId),
    insights: listCrmInsights(customerId),
    lifetimeValue: calculateCustomerLifetimeValue(customerId),
    generatedAt: new Date().toISOString(),
  };
}

export function readCrmFoundationCapabilities() {
  return {
    customerProfiles: listCrmCustomers(),
    customerTimeline: buildCustomerTimeline("crm-customer-anna"),
    customerSegments: filterCustomersBySegment("vip_customer"),
    vipCustomers: listVipCustomers(),
    repeatCustomers: listRepeatCustomers(),
    lifetimeValue: calculateCustomerLifetimeValue("crm-customer-elena"),
    purchaseHistory: listPurchaseHistory(),
    notes: listCustomerNotes(),
    tags: listCustomerTagAssignments(),
    favoriteFlowers: listCrmCustomers()[0]?.favoriteFlowers ?? [],
    reminderRegistry: listReminderQueue(),
    crmStatistics: calculateCrmStatistics(),
    crmInsights: listCrmInsights(),
    aiCrmPreparation: listAiCrmPreparations(),
    highValueCustomers: listHighValueCustomers(),
    atRiskCustomers: listAtRiskCustomers(),
  };
}

export const CRM_INTELLIGENCE_ENGINE_SCHEMA = {
  module: "crmIntelligence",
  storageKeys: [
    CRM_INTELLIGENCE_STORAGE_KEY,
    "bellaflore_crm_intelligence_customers_v1",
    "bellaflore_crm_intelligence_purchase_history_v1",
    "bellaflore_crm_intelligence_timeline_v1",
    "bellaflore_crm_intelligence_notes_v1",
    "bellaflore_crm_intelligence_reminders_v1",
    "bellaflore_crm_intelligence_insights_v1",
    "bellaflore_crm_intelligence_tags_v1",
    "bellaflore_crm_intelligence_ai_v1",
  ],
  capabilities: [
    "customer_profiles",
    "customer_timeline",
    "customer_segments",
    "vip_customers",
    "repeat_customers",
    "lifetime_value",
    "purchase_history",
    "notes",
    "tags",
    "favorite_flowers",
    "reminder_registry",
    "crm_statistics",
    "crm_insights",
    "ai_crm_preparation",
  ],
  layers: [
    { id: "types", file: "crmTypes.ts" },
    { id: "examples", file: "crmExamples.ts" },
    {
      id: "registries",
      files: [
        "customerRegistry.ts",
        "customerSegments.ts",
        "customerHistory.ts",
        "customerTags.ts",
      ],
    },
    { id: "engine", file: "crmEngine.ts" },
    { id: "foundation", file: "crmIntelligenceFoundation.ts" },
  ],
  mode: "isolated_foundation",
  wired: false,
} as const;

export function listAllCrmFoundationCapabilities() {
  return readCrmFoundationCapabilities();
}
