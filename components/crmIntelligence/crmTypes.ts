// ==================================================
// SECTION: CRM INTELLIGENCE
// РАЗДЕЛ: Типы
// ==================================================

export type CrmCustomerSegment =
  | "new_customer"
  | "repeat_customer"
  | "vip_customer"
  | "at_risk_customer"
  | "inactive_customer"
  | "high_value_customer"
  | "gift_buyer"
  | "corporate_customer";

export type CrmVipLevel = 0 | 1 | 2 | 3;

export type CrmTag =
  | "vip"
  | "loyal"
  | "gift_buyer"
  | "corporate"
  | "at_risk"
  | "seasonal"
  | "new";

export type CrmTimelineEventKind =
  | "order"
  | "note"
  | "tag"
  | "reminder"
  | "communication"
  | "segment_change";

export type CrmReminderStatus = "pending" | "sent" | "dismissed" | "completed";

export type CrmReminderPriority = "low" | "normal" | "high";

export type CrmAiPreparationStatus = "suggestion_only";

export type CrmCustomerProfile = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  segment: CrmCustomerSegment;
  vipLevel: CrmVipLevel;
  tags: CrmTag[];
  favoriteFlowers: string[];
  notes: string[];
  totalOrders: number;
  totalSpendRub: number;
  lifetimeValueScore: number;
  lastOrderAt: string | null;
  firstOrderAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CrmPurchaseHistoryEntry = {
  id: string;
  customerId: string;
  orderId: string;
  totalRub: number;
  itemsSummary: string;
  status: string;
  purchasedAt: string;
};

export type CrmTimelineEvent = {
  id: string;
  customerId: string;
  kind: CrmTimelineEventKind;
  title: string;
  message: string;
  occurredAt: string;
};

export type CrmCustomerNote = {
  id: string;
  customerId: string;
  text: string;
  author: string;
  createdAt: string;
};

export type CrmCustomerTagAssignment = {
  id: string;
  customerId: string;
  tag: CrmTag;
  assignedAt: string;
};

export type CrmReminder = {
  id: string;
  customerId: string;
  title: string;
  date: string;
  reminderBeforeDays: number;
  priority: CrmReminderPriority;
  status: CrmReminderStatus;
  createdAt: string;
};

export type CrmLifetimeValue = {
  customerId: string;
  totalSpendRub: number;
  totalOrders: number;
  averageOrderValueRub: number;
  projectedAnnualValueRub: number;
  score: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  calculatedAt: string;
};

export type CrmInsight = {
  id: string;
  customerId: string;
  kind: "retention" | "upsell" | "risk" | "vip" | "occasion";
  title: string;
  message: string;
  priority: "low" | "normal" | "high";
  createdAt: string;
};

export type CrmAiPreparation = {
  id: string;
  title: string;
  rationale: string;
  suggestedAction: string;
  confidence: number;
  status: CrmAiPreparationStatus;
  createdAt: string;
};

export type CrmStatistics = {
  totalCustomers: number;
  vipCustomers: number;
  repeatCustomers: number;
  atRiskCustomers: number;
  averageLifetimeValue: number;
  averageOrdersPerCustomer: number;
  topSegment: CrmCustomerSegment | null;
  pendingReminders: number;
  calculatedAt: string;
};

export type CrmIntelligenceSnapshot = {
  customers: CrmCustomerProfile[];
  purchaseHistory: CrmPurchaseHistoryEntry[];
  timeline: CrmTimelineEvent[];
  notes: CrmCustomerNote[];
  tagAssignments: CrmCustomerTagAssignment[];
  reminders: CrmReminder[];
  insights: CrmInsight[];
  aiPreparations: CrmAiPreparation[];
  statistics: CrmStatistics;
  generatedAt: string;
};

export type CrmListFilters = {
  segment?: CrmCustomerSegment | CrmCustomerSegment[];
  vipLevel?: CrmVipLevel;
  tag?: CrmTag;
  query?: string;
};

export type CrmRegistryState = {
  customers: CrmCustomerProfile[];
  purchaseHistory: CrmPurchaseHistoryEntry[];
  timeline: CrmTimelineEvent[];
  notes: CrmCustomerNote[];
  tagAssignments: CrmCustomerTagAssignment[];
  reminders: CrmReminder[];
  insights: CrmInsight[];
  aiPreparations: CrmAiPreparation[];
};

export type CrmReadOnlySummary = {
  customerCount: number;
  vipCount: number;
  repeatCount: number;
  reminderCount: number;
  insightCount: number;
};
