// ==================================================
// SECTION: CUSTOMER INTELLIGENCE
// РАЗДЕЛ: Admin foundation
// ==================================================
import {
  getCustomerProfile,
  listCustomerProfiles,
} from "@/components/customerIntelligence/customerProfileEngine";
import { listCustomerReminderQueue } from "@/components/customerIntelligence/customerReminderEngine";
import type {
  AdminCustomerDetails,
  AdminCustomerListItem,
  CustomerListFilters,
  CustomerProfile,
  CustomerSegment,
  CustomerTimelineEvent,
} from "@/components/customerIntelligence/customerIntelligenceTypes";

function matchesSegment(
  profile: CustomerProfile,
  segment?: CustomerListFilters["segment"],
): boolean {
  if (!segment) {
    return true;
  }

  if (Array.isArray(segment)) {
    return segment.includes(profile.segment);
  }

  return profile.segment === segment;
}

function matchesQuery(profile: CustomerProfile, query?: string): boolean {
  if (!query?.trim()) {
    return true;
  }

  const normalized = query.trim().toLowerCase();

  return (
    profile.fullName.toLowerCase().includes(normalized) ||
    profile.phone.replace(/\D/g, "").includes(normalized.replace(/\D/g, "")) ||
    (profile.email?.toLowerCase().includes(normalized) ?? false)
  );
}

export function filterCustomersBySegment(
  segment: CustomerSegment | CustomerSegment[],
): CustomerProfile[] {
  return listCustomerProfiles().filter((profile) => matchesSegment(profile, segment));
}

export function listAdminCustomers(
  filters: CustomerListFilters = {},
): AdminCustomerListItem[] {
  return listCustomerProfiles()
    .filter((profile) => matchesSegment(profile, filters.segment))
    .filter((profile) =>
      filters.vipLevel === undefined ? true : profile.vipLevel === filters.vipLevel,
    )
    .filter((profile) => matchesQuery(profile, filters.query))
    .map((profile) => ({
      id: profile.id,
      fullName: profile.fullName,
      phone: profile.phone,
      segment: profile.segment,
      vipLevel: profile.vipLevel,
      totalOrders: profile.statistics.totalOrders,
      totalRevenue: profile.statistics.totalRevenue,
      lastOrderDate: profile.statistics.lastOrderDate,
      riskLevel: profile.riskScore.level,
      updatedAt: profile.updatedAt,
    }));
}

export function getAdminCustomerDetails(
  customerId: string,
): AdminCustomerDetails | null {
  const profile = getCustomerProfile(customerId);
  if (!profile) {
    return null;
  }

  return {
    ...profile,
    timeline: getCustomerTimeline(customerId),
  };
}

export function getVIPCustomers(): AdminCustomerListItem[] {
  return listAdminCustomers().filter(
    (customer) =>
      customer.vipLevel >= 2 || customer.segment === "vip_customer",
  );
}

export function getAtRiskCustomers(): AdminCustomerListItem[] {
  return listAdminCustomers().filter(
    (customer) =>
      customer.segment === "at_risk_customer" ||
      customer.riskLevel === "high" ||
      customer.riskLevel === "critical",
  );
}

export function getCustomerTimeline(customerId: string): CustomerTimelineEvent[] {
  const profile = getCustomerProfile(customerId);
  if (!profile) {
    return [];
  }

  const events: CustomerTimelineEvent[] = [];

  for (const entry of profile.history.entries) {
    events.push({
      id: `timeline-order-${entry.id}`,
      kind: "order",
      title: `Заказ ${entry.orderId}`,
      message: `${entry.itemsSummary} — ${entry.totalRub} ₽ (${entry.status})`,
      occurredAt: entry.occurredAt,
    });
  }

  for (const communication of profile.communicationHistory) {
    events.push({
      id: `timeline-communication-${communication.id}`,
      kind: "communication",
      title: communication.subject,
      message: communication.message,
      occurredAt: communication.createdAt,
    });
  }

  for (const occasion of profile.occasions) {
    events.push({
      id: `timeline-occasion-${occasion.id}`,
      kind: "occasion",
      title: occasion.title,
      message: occasion.recipientName
        ? `Для ${occasion.recipientName}, ${occasion.date}`
        : occasion.date,
      occurredAt: occasion.createdAt,
    });
  }

  for (const reminder of profile.reminders) {
    events.push({
      id: `timeline-reminder-${reminder.id}`,
      kind: "reminder",
      title: reminder.title,
      message: `Напоминание ${reminder.date} (${reminder.status})`,
      occurredAt: reminder.createdAt,
    });
  }

  for (const [index, note] of profile.notes.entries()) {
    events.push({
      id: `timeline-note-${profile.id}-${index}`,
      kind: "note",
      title: "Заметка",
      message: note,
      occurredAt: profile.updatedAt,
    });
  }

  return events.sort(
    (left, right) =>
      new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
  );
}

export function getCustomerReminderQueue() {
  return listCustomerReminderQueue();
}
