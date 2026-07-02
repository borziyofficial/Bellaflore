// ==================================================
// SECTION: CUSTOMER INTELLIGENCE
// РАЗДЕЛ: Reminder engine
// ==================================================
import {
  getCustomerProfile,
  listCustomerProfiles,
  saveCustomerProfileState,
} from "@/components/customerIntelligence/customerProfileEngine";
import type {
  CustomerProfile,
  CustomerReminder,
  CustomerReminderStatus,
} from "@/components/customerIntelligence/customerIntelligenceTypes";

function generateReminderId(): string {
  return `reminder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createCustomerReminder(
  customerId: string,
  reminder: Omit<CustomerReminder, "id" | "customerId" | "createdAt" | "status"> & {
    status?: CustomerReminderStatus;
  },
): CustomerProfile | null {
  const profile = getCustomerProfile(customerId);
  if (!profile) {
    return null;
  }

  const entry: CustomerReminder = {
    ...reminder,
    id: generateReminderId(),
    customerId,
    status: reminder.status ?? "pending",
    createdAt: new Date().toISOString(),
  };

  return saveCustomerProfileState({
    ...profile,
    reminders: [...profile.reminders, entry],
  });
}

export function listCustomerReminders(
  customerId?: string,
  status?: CustomerReminderStatus,
): CustomerReminder[] {
  const profiles = customerId
    ? [getCustomerProfile(customerId)].filter(Boolean)
    : listCustomerProfiles();

  const reminders = profiles.flatMap((profile) => profile!.reminders);

  if (!status) {
    return reminders;
  }

  return reminders.filter((reminder) => reminder.status === status);
}

export function listCustomerReminderQueue(): CustomerReminder[] {
  const now = new Date();

  return listCustomerReminders(undefined, "pending").filter((reminder) => {
    const target = new Date(reminder.date);
    target.setDate(target.getDate() - reminder.reminderBeforeDays);
    return target.getTime() <= now.getTime();
  });
}

export function updateCustomerReminderStatus(
  customerId: string,
  reminderId: string,
  status: CustomerReminderStatus,
): CustomerProfile | null {
  const profile = getCustomerProfile(customerId);
  if (!profile) {
    return null;
  }

  return saveCustomerProfileState({
    ...profile,
    reminders: profile.reminders.map((reminder) =>
      reminder.id === reminderId ? { ...reminder, status } : reminder,
    ),
  });
}

export function buildRemindersForOccasions(profile: CustomerProfile): CustomerReminder[] {
  return profile.occasions.map((occasion) => ({
    id: `reminder-${occasion.id}`,
    occasionId: occasion.id,
    customerId: profile.id,
    title: occasion.title,
    date: occasion.date,
    reminderBeforeDays: 7,
    priority: occasion.kind === "wedding" ? "high" : "normal",
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  }));
}
