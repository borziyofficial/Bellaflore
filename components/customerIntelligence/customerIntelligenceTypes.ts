// ==================================================
// SECTION: CUSTOMER INTELLIGENCE
// РАЗДЕЛ: Типы
// ==================================================
export type CustomerSegment =
  | "new_customer"
  | "returning_customer"
  | "vip_customer"
  | "corporate_customer"
  | "inactive_customer"
  | "high_value_customer"
  | "at_risk_customer"
  | "gift_buyer"
  | "seasonal_buyer";

export type CustomerVipLevel = 0 | 1 | 2 | 3;

export type CustomerOccasionKind =
  | "birthday"
  | "anniversary"
  | "wedding"
  | "holiday"
  | "custom";

export type CustomerReminderStatus = "pending" | "sent" | "dismissed" | "completed";

export type CustomerReminderPriority = "low" | "normal" | "high";

export type CustomerCommunicationChannel =
  | "telegram"
  | "sms"
  | "whatsapp"
  | "email"
  | "phone"
  | "in_app";

export type CustomerTag =
  | "vip"
  | "corporate"
  | "gift_buyer"
  | "seasonal"
  | "at_risk"
  | "loyal"
  | "new";

export type CustomerAddress = {
  id: string;
  label: string;
  address: string;
  zoneId: string | null;
  isDefault: boolean;
  createdAt: string;
};

export type CustomerRecipient = {
  id: string;
  name: string;
  phone: string | null;
  relation: string | null;
  createdAt: string;
};

export type CustomerFavorite = {
  id: string;
  productId: string;
  productTitle: string;
  categoryId: string | null;
  addedAt: string;
};

export type CustomerPreference = {
  favoriteFlowers: string[];
  favoriteColors: string[];
  favoriteBouquetStyles: string[];
  favoriteCategories: string[];
  preferredDeliveryZones: string[];
  preferredDeliveryTimes: string[];
  preferredAddOns: string[];
  dislikedFlowers: string[];
  dislikedColors: string[];
  updatedAt: string;
};

export type CustomerOccasion = {
  id: string;
  kind: CustomerOccasionKind;
  title: string;
  date: string;
  recipientName: string | null;
  notes: string | null;
  createdAt: string;
};

export type CustomerHistoryEntry = {
  id: string;
  orderId: string;
  status: string;
  totalRub: number;
  deliveryDate: string;
  itemsSummary: string;
  occurredAt: string;
};

export type CustomerHistory = {
  entries: CustomerHistoryEntry[];
  syncedAt: string | null;
};

export type CustomerStatistics = {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  totalRevenue: number;
  lastOrderDate: string | null;
  firstOrderDate: string | null;
  orderFrequencyDays: number | null;
  favoriteCategory: string | null;
  favoriteFlower: string | null;
  repeatPurchaseScore: number;
  calculatedAt: string;
};

export type CustomerLifetimeValue = {
  totalRevenue: number;
  projectedAnnualValue: number;
  orderCount: number;
  averageOrderValue: number;
  loyaltyMultiplier: number;
  score: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  calculatedAt: string;
};

export type CustomerRiskScore = {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  reasons: string[];
  calculatedAt: string;
};

export type CustomerReminder = {
  id: string;
  occasionId: string;
  customerId: string;
  title: string;
  date: string;
  reminderBeforeDays: number;
  priority: CustomerReminderPriority;
  status: CustomerReminderStatus;
  createdAt: string;
};

export type CustomerCommunicationHistory = {
  id: string;
  channel: CustomerCommunicationChannel;
  direction: "inbound" | "outbound";
  subject: string;
  message: string;
  relatedOrderId: string | null;
  createdAt: string;
};

export type CustomerProfile = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  addresses: CustomerAddress[];
  recipients: CustomerRecipient[];
  favorites: CustomerFavorite[];
  preferences: CustomerPreference;
  occasions: CustomerOccasion[];
  history: CustomerHistory;
  statistics: CustomerStatistics;
  lifetimeValue: CustomerLifetimeValue;
  riskScore: CustomerRiskScore;
  segment: CustomerSegment;
  vipLevel: CustomerVipLevel;
  reminders: CustomerReminder[];
  tags: CustomerTag[];
  notes: string[];
  communicationHistory: CustomerCommunicationHistory[];
  createdAt: string;
  updatedAt: string;
};

export type CustomerProfileInput = {
  fullName: string;
  phone: string;
  email?: string | null;
  notes?: string[];
  tags?: CustomerTag[];
};

export type CustomerListFilters = {
  segment?: CustomerSegment | CustomerSegment[];
  vipLevel?: CustomerVipLevel;
  query?: string;
};

export type AdminCustomerListItem = {
  id: string;
  fullName: string;
  phone: string;
  segment: CustomerSegment;
  vipLevel: CustomerVipLevel;
  totalOrders: number;
  totalRevenue: number;
  lastOrderDate: string | null;
  riskLevel: CustomerRiskScore["level"];
  updatedAt: string;
};

export type AdminCustomerDetails = CustomerProfile & {
  timeline: CustomerTimelineEvent[];
};

export type CustomerTimelineEvent = {
  id: string;
  kind: "order" | "communication" | "occasion" | "reminder" | "note";
  title: string;
  message: string;
  occurredAt: string;
};

export type CustomerPublicSummary = {
  id: string;
  fullName: string;
  favoriteCount: number;
  segment: CustomerSegment;
  vipLevel: CustomerVipLevel;
  preferredDeliveryTimes: string[];
  favoriteCategories: string[];
};

export type AiCustomerHooks = {
  suggestNextPurchase?: (profile: CustomerProfile) => Promise<{ productIds: string[]; rationale: string } | null>;
  detectVIPCustomer?: (profile: CustomerProfile) => Promise<boolean>;
  detectCustomerRisk?: (profile: CustomerProfile) => Promise<CustomerRiskScore>;
  recommendBouquetForCustomer?: (profile: CustomerProfile) => Promise<{ productIds: string[]; reason: string } | null>;
  detectImportantDate?: (profile: CustomerProfile) => Promise<CustomerOccasion | null>;
  summarizeCustomerProfile?: (profile: CustomerProfile) => Promise<{ summary: string; highlights: string[] }>;
  suggestCustomerRetentionAction?: (profile: CustomerProfile) => Promise<{ action: string; rationale: string } | null>;
};
