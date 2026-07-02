// ==================================================
// SECTION: CRM INTELLIGENCE
// РАЗДЕЛ: Customer history
// ==================================================
import { buildCrmExampleRegistryState } from "@/components/crmIntelligence/crmExamples";
import type {
  CrmCustomerNote,
  CrmInsight,
  CrmPurchaseHistoryEntry,
  CrmReminder,
  CrmTimelineEvent,
} from "@/components/crmIntelligence/crmTypes";

export const CRM_PURCHASE_HISTORY_STORAGE_KEY =
  "bellaflore_crm_intelligence_purchase_history_v1";

export const CRM_TIMELINE_STORAGE_KEY =
  "bellaflore_crm_intelligence_timeline_v1";

export const CRM_NOTES_STORAGE_KEY =
  "bellaflore_crm_intelligence_notes_v1";

export const CRM_REMINDERS_STORAGE_KEY =
  "bellaflore_crm_intelligence_reminders_v1";

export const CRM_INSIGHTS_STORAGE_KEY =
  "bellaflore_crm_intelligence_insights_v1";

let inMemoryPurchaseHistory: CrmPurchaseHistoryEntry[] | null = null;
let inMemoryTimeline: CrmTimelineEvent[] | null = null;
let inMemoryNotes: CrmCustomerNote[] | null = null;
let inMemoryReminders: CrmReminder[] | null = null;
let inMemoryInsights: CrmInsight[] | null = null;

function readPurchaseHistoryFromStorage(): CrmPurchaseHistoryEntry[] {
  if (typeof window === "undefined") {
    return inMemoryPurchaseHistory ?? buildCrmExampleRegistryState().purchaseHistory;
  }

  try {
    const raw = window.localStorage.getItem(CRM_PURCHASE_HISTORY_STORAGE_KEY);
    if (!raw) {
      return inMemoryPurchaseHistory ?? buildCrmExampleRegistryState().purchaseHistory;
    }

    const parsed = JSON.parse(raw) as CrmPurchaseHistoryEntry[];
    return Array.isArray(parsed)
      ? parsed
      : buildCrmExampleRegistryState().purchaseHistory;
  } catch {
    return inMemoryPurchaseHistory ?? buildCrmExampleRegistryState().purchaseHistory;
  }
}

function writePurchaseHistoryToStorage(entries: CrmPurchaseHistoryEntry[]): void {
  inMemoryPurchaseHistory = entries;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CRM_PURCHASE_HISTORY_STORAGE_KEY,
      JSON.stringify(entries),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function readTimelineFromStorage(): CrmTimelineEvent[] {
  if (typeof window === "undefined") {
    return inMemoryTimeline ?? buildCrmExampleRegistryState().timeline;
  }

  try {
    const raw = window.localStorage.getItem(CRM_TIMELINE_STORAGE_KEY);
    if (!raw) {
      return inMemoryTimeline ?? buildCrmExampleRegistryState().timeline;
    }

    const parsed = JSON.parse(raw) as CrmTimelineEvent[];
    return Array.isArray(parsed) ? parsed : buildCrmExampleRegistryState().timeline;
  } catch {
    return inMemoryTimeline ?? buildCrmExampleRegistryState().timeline;
  }
}

function writeTimelineToStorage(events: CrmTimelineEvent[]): void {
  inMemoryTimeline = events;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CRM_TIMELINE_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // In-memory fallback remains active.
  }
}

function readNotesFromStorage(): CrmCustomerNote[] {
  if (typeof window === "undefined") {
    return inMemoryNotes ?? buildCrmExampleRegistryState().notes;
  }

  try {
    const raw = window.localStorage.getItem(CRM_NOTES_STORAGE_KEY);
    if (!raw) {
      return inMemoryNotes ?? buildCrmExampleRegistryState().notes;
    }

    const parsed = JSON.parse(raw) as CrmCustomerNote[];
    return Array.isArray(parsed) ? parsed : buildCrmExampleRegistryState().notes;
  } catch {
    return inMemoryNotes ?? buildCrmExampleRegistryState().notes;
  }
}

function writeNotesToStorage(notes: CrmCustomerNote[]): void {
  inMemoryNotes = notes;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CRM_NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // In-memory fallback remains active.
  }
}

function readRemindersFromStorage(): CrmReminder[] {
  if (typeof window === "undefined") {
    return inMemoryReminders ?? buildCrmExampleRegistryState().reminders;
  }

  try {
    const raw = window.localStorage.getItem(CRM_REMINDERS_STORAGE_KEY);
    if (!raw) {
      return inMemoryReminders ?? buildCrmExampleRegistryState().reminders;
    }

    const parsed = JSON.parse(raw) as CrmReminder[];
    return Array.isArray(parsed) ? parsed : buildCrmExampleRegistryState().reminders;
  } catch {
    return inMemoryReminders ?? buildCrmExampleRegistryState().reminders;
  }
}

function writeRemindersToStorage(reminders: CrmReminder[]): void {
  inMemoryReminders = reminders;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CRM_REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
  } catch {
    // In-memory fallback remains active.
  }
}

function readInsightsFromStorage(): CrmInsight[] {
  if (typeof window === "undefined") {
    return inMemoryInsights ?? buildCrmExampleRegistryState().insights;
  }

  try {
    const raw = window.localStorage.getItem(CRM_INSIGHTS_STORAGE_KEY);
    if (!raw) {
      return inMemoryInsights ?? buildCrmExampleRegistryState().insights;
    }

    const parsed = JSON.parse(raw) as CrmInsight[];
    return Array.isArray(parsed) ? parsed : buildCrmExampleRegistryState().insights;
  } catch {
    return inMemoryInsights ?? buildCrmExampleRegistryState().insights;
  }
}

function writeInsightsToStorage(insights: CrmInsight[]): void {
  inMemoryInsights = insights;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CRM_INSIGHTS_STORAGE_KEY, JSON.stringify(insights));
  } catch {
    // In-memory fallback remains active.
  }
}

export function listPurchaseHistory(customerId?: string): CrmPurchaseHistoryEntry[] {
  const entries = readPurchaseHistoryFromStorage();

  return (customerId ? entries.filter((e) => e.customerId === customerId) : entries).sort(
    (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime(),
  );
}

export function buildCustomerTimeline(customerId: string): CrmTimelineEvent[] {
  const fromStore = readTimelineFromStorage().filter((e) => e.customerId === customerId);

  const fromOrders: CrmTimelineEvent[] = listPurchaseHistory(customerId).map((entry) => ({
    id: `timeline-order-${entry.id}`,
    customerId,
    kind: "order" as const,
    title: `Заказ ${entry.orderId}`,
    message: `${entry.itemsSummary} — ${entry.totalRub} ₽ (${entry.status})`,
    occurredAt: entry.purchasedAt,
  }));

  const fromNotes: CrmTimelineEvent[] = listCustomerNotes(customerId).map((note) => ({
    id: `timeline-note-${note.id}`,
    customerId,
    kind: "note" as const,
    title: "Заметка",
    message: note.text,
    occurredAt: note.createdAt,
  }));

  const merged = [...fromStore, ...fromOrders, ...fromNotes];

  return merged.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}

export function listCustomerNotes(customerId?: string): CrmCustomerNote[] {
  const notes = readNotesFromStorage();
  return customerId ? notes.filter((n) => n.customerId === customerId) : notes;
}

export function listCrmReminders(
  customerId?: string,
  status?: CrmReminder["status"],
): CrmReminder[] {
  return readRemindersFromStorage()
    .filter((r) => (customerId ? r.customerId === customerId : true))
    .filter((r) => (status ? r.status === status : true));
}

export function listReminderQueue(): CrmReminder[] {
  const now = new Date();

  return listCrmReminders(undefined, "pending").filter((reminder) => {
    const target = new Date(reminder.date);
    target.setDate(target.getDate() - reminder.reminderBeforeDays);
    return target.getTime() <= now.getTime();
  });
}

export function listCrmInsights(customerId?: string): CrmInsight[] {
  const insights = readInsightsFromStorage();
  return customerId ? insights.filter((i) => i.customerId === customerId) : insights;
}

export function registerPurchaseHistoryEntry(
  entry: CrmPurchaseHistoryEntry,
): CrmPurchaseHistoryEntry {
  writePurchaseHistoryToStorage([entry, ...readPurchaseHistoryFromStorage()]);
  return entry;
}

export function registerTimelineEvent(event: CrmTimelineEvent): CrmTimelineEvent {
  writeTimelineToStorage([event, ...readTimelineFromStorage()]);
  return event;
}

export function registerCustomerNote(note: CrmCustomerNote): CrmCustomerNote {
  writeNotesToStorage([note, ...readNotesFromStorage()]);
  return note;
}

export function registerCrmReminder(reminder: CrmReminder): CrmReminder {
  writeRemindersToStorage([reminder, ...readRemindersFromStorage()]);
  return reminder;
}

export function registerCrmInsight(insight: CrmInsight): CrmInsight {
  writeInsightsToStorage([insight, ...readInsightsFromStorage()]);
  return insight;
}

export function seedCrmHistoryRegistry(): CrmPurchaseHistoryEntry[] {
  const seed = buildCrmExampleRegistryState();
  writePurchaseHistoryToStorage(seed.purchaseHistory);
  writeTimelineToStorage(seed.timeline);
  writeNotesToStorage(seed.notes);
  writeRemindersToStorage(seed.reminders);
  writeInsightsToStorage(seed.insights);
  return listPurchaseHistory();
}

export function clearCrmHistoryRegistry(): void {
  writePurchaseHistoryToStorage([]);
  writeTimelineToStorage([]);
  writeNotesToStorage([]);
  writeRemindersToStorage([]);
  writeInsightsToStorage([]);
}
