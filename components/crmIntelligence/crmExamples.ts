// ==================================================
// SECTION: CRM INTELLIGENCE
// РАЗДЕЛ: Seed examples
// ==================================================
import type {
  CrmAiPreparation,
  CrmCustomerNote,
  CrmCustomerProfile,
  CrmCustomerTagAssignment,
  CrmInsight,
  CrmPurchaseHistoryEntry,
  CrmReminder,
  CrmTimelineEvent,
} from "@/components/crmIntelligence/crmTypes";

const NOW = new Date().toISOString();

export const CRM_EXAMPLE_CUSTOMERS: CrmCustomerProfile[] = [
  {
    id: "crm-customer-anna",
    fullName: "Анна Иванова",
    phone: "+7 999 111-22-33",
    email: "anna@example.com",
    segment: "vip_customer",
    vipLevel: 2,
    tags: ["vip", "loyal", "gift_buyer"],
    favoriteFlowers: ["rose", "peony"],
    notes: ["Любит premium букеты", "Часто заказывает в подарок маме"],
    totalOrders: 8,
    totalSpendRub: 52000,
    lifetimeValueScore: 78,
    lastOrderAt: "2026-05-10T14:30:00.000Z",
    firstOrderAt: "2025-11-15T10:00:00.000Z",
    createdAt: "2025-11-15T10:00:00.000Z",
    updatedAt: NOW,
  },
  {
    id: "crm-customer-elena",
    fullName: "Елена Смирнова",
    phone: "+7 999 555-66-77",
    email: "elena@example.com",
    segment: "high_value_customer",
    vipLevel: 3,
    tags: ["vip", "loyal", "corporate"],
    favoriteFlowers: ["peony", "orchid"],
    notes: ["Корпоративные заказы", "VIP персональный менеджер"],
    totalOrders: 22,
    totalSpendRub: 285000,
    lifetimeValueScore: 96,
    lastOrderAt: "2026-06-20T16:00:00.000Z",
    firstOrderAt: "2024-08-10T12:00:00.000Z",
    createdAt: "2024-08-10T12:00:00.000Z",
    updatedAt: NOW,
  },
  {
    id: "crm-customer-maria",
    fullName: "Мария Петрова",
    phone: "+7 999 222-33-44",
    email: null,
    segment: "repeat_customer",
    vipLevel: 1,
    tags: ["loyal"],
    favoriteFlowers: ["tulip"],
    notes: [],
    totalOrders: 3,
    totalSpendRub: 11500,
    lifetimeValueScore: 45,
    lastOrderAt: "2026-04-02T11:00:00.000Z",
    firstOrderAt: "2026-01-20T09:00:00.000Z",
    createdAt: "2026-01-20T09:00:00.000Z",
    updatedAt: NOW,
  },
  {
    id: "crm-customer-ivan",
    fullName: "Иван Козлов",
    phone: "+7 999 333-44-55",
    email: "ivan@example.com",
    segment: "at_risk_customer",
    vipLevel: 0,
    tags: ["at_risk"],
    favoriteFlowers: ["rose"],
    notes: ["Долго не заказывал"],
    totalOrders: 2,
    totalSpendRub: 7800,
    lifetimeValueScore: 28,
    lastOrderAt: "2025-12-01T10:00:00.000Z",
    firstOrderAt: "2025-06-10T14:00:00.000Z",
    createdAt: "2025-06-10T14:00:00.000Z",
    updatedAt: NOW,
  },
];

export const CRM_EXAMPLE_PURCHASE_HISTORY: CrmPurchaseHistoryEntry[] = [
  {
    id: "crm-purchase-anna-001",
    customerId: "crm-customer-anna",
    orderId: "order-anna-001",
    totalRub: 6500,
    itemsSummary: "Premium розы, открытка",
    status: "delivered",
    purchasedAt: "2026-05-10T14:30:00.000Z",
  },
  {
    id: "crm-purchase-anna-002",
    customerId: "crm-customer-anna",
    orderId: "order-anna-002",
    totalRub: 7200,
    itemsSummary: "Пионы Premium",
    status: "delivered",
    purchasedAt: "2026-04-02T11:00:00.000Z",
  },
  {
    id: "crm-purchase-elena-001",
    customerId: "crm-customer-elena",
    orderId: "order-elena-001",
    totalRub: 15800,
    itemsSummary: "Корпоративная композиция",
    status: "delivered",
    purchasedAt: "2026-06-20T16:00:00.000Z",
  },
];

export const CRM_EXAMPLE_TIMELINE: CrmTimelineEvent[] = [
  {
    id: "crm-timeline-anna-order",
    customerId: "crm-customer-anna",
    kind: "order",
    title: "Заказ order-anna-001",
    message: "Premium розы — 6500 ₽ (delivered)",
    occurredAt: "2026-05-10T14:30:00.000Z",
  },
  {
    id: "crm-timeline-anna-note",
    customerId: "crm-customer-anna",
    kind: "note",
    title: "Заметка",
    message: "Любит premium букеты",
    occurredAt: "2026-03-01T09:00:00.000Z",
  },
  {
    id: "crm-timeline-ivan-risk",
    customerId: "crm-customer-ivan",
    kind: "segment_change",
    title: "Сегмент изменён",
    message: "at_risk_customer — долго не заказывал",
    occurredAt: "2026-02-15T08:00:00.000Z",
  },
];

export const CRM_EXAMPLE_NOTES: CrmCustomerNote[] = [
  {
    id: "crm-note-anna-001",
    customerId: "crm-customer-anna",
    text: "Любит premium букеты",
    author: "admin",
    createdAt: "2026-03-01T09:00:00.000Z",
  },
  {
    id: "crm-note-elena-001",
    customerId: "crm-customer-elena",
    text: "Корпоративные заказы — связаться заранее",
    author: "admin",
    createdAt: "2025-11-01T10:00:00.000Z",
  },
];

export const CRM_EXAMPLE_TAG_ASSIGNMENTS: CrmCustomerTagAssignment[] = [
  {
    id: "crm-tag-anna-vip",
    customerId: "crm-customer-anna",
    tag: "vip",
    assignedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "crm-tag-anna-gift",
    customerId: "crm-customer-anna",
    tag: "gift_buyer",
    assignedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "crm-tag-ivan-risk",
    customerId: "crm-customer-ivan",
    tag: "at_risk",
    assignedAt: "2026-02-15T08:00:00.000Z",
  },
];

export const CRM_EXAMPLE_REMINDERS: CrmReminder[] = [
  {
    id: "crm-reminder-anna-birthday",
    customerId: "crm-customer-anna",
    title: "День рождения мамы",
    date: "2026-05-12",
    reminderBeforeDays: 7,
    priority: "high",
    status: "pending",
    createdAt: NOW,
  },
  {
    id: "crm-reminder-ivan-reactivation",
    customerId: "crm-customer-ivan",
    title: "Reactivation outreach",
    date: "2026-07-01",
    reminderBeforeDays: 3,
    priority: "normal",
    status: "pending",
    createdAt: NOW,
  },
];

export const CRM_EXAMPLE_INSIGHTS: CrmInsight[] = [
  {
    id: "crm-insight-ivan-risk",
    customerId: "crm-customer-ivan",
    kind: "risk",
    title: "At risk customer",
    message: "Не заказывал более 6 месяцев — предложить reactivation",
    priority: "high",
    createdAt: NOW,
  },
  {
    id: "crm-insight-anna-upsell",
    customerId: "crm-customer-anna",
    kind: "upsell",
    title: "Upsell opportunity",
    message: "VIP клиент — предложить premium peony collection",
    priority: "normal",
    createdAt: NOW,
  },
  {
    id: "crm-insight-elena-vip",
    customerId: "crm-customer-elena",
    kind: "vip",
    title: "VIP retention",
    message: "High LTV — персональное предложение и early access",
    priority: "high",
    createdAt: NOW,
  },
];

export const CRM_EXAMPLE_AI_PREPARATIONS: CrmAiPreparation[] = [
  {
    id: "crm-ai-reactivation-campaign",
    title: "Reactivation campaign for at-risk segment",
    rationale: "4 клиента в at_risk — подготовить персональные offers",
    suggestedAction: "launch_reactivation_sequence",
    confidence: 0.79,
    status: "suggestion_only",
    createdAt: NOW,
  },
  {
    id: "crm-ai-vip-outreach",
    title: "VIP outreach batch",
    rationale: "VIP customers с высоким LTV — quarterly check-in",
    suggestedAction: "schedule_vip_outreach",
    confidence: 0.84,
    status: "suggestion_only",
    createdAt: NOW,
  },
];

export function buildCrmExampleRegistryState() {
  return {
    customers: [...CRM_EXAMPLE_CUSTOMERS],
    purchaseHistory: [...CRM_EXAMPLE_PURCHASE_HISTORY],
    timeline: [...CRM_EXAMPLE_TIMELINE],
    notes: [...CRM_EXAMPLE_NOTES],
    tagAssignments: [...CRM_EXAMPLE_TAG_ASSIGNMENTS],
    reminders: [...CRM_EXAMPLE_REMINDERS],
    insights: [...CRM_EXAMPLE_INSIGHTS],
    aiPreparations: [...CRM_EXAMPLE_AI_PREPARATIONS],
  };
}
