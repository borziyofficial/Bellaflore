// ==================================================
// SECTION: NOTIFICATION INTELLIGENCE
// РАЗДЕЛ: Escalation foundation
// ==================================================
import {
  createNotification,
  listPendingNotifications,
} from "@/components/notificationIntelligence/notificationQueueEngine";
import type {
  EscalationPlan,
  NotificationEvent,
  NotificationQueueItem,
} from "@/components/notificationIntelligence/notificationIntelligenceTypes";
import { buildEscalationNotificationsForEvent } from "@/components/notificationIntelligence/notificationRuleEngine";
import { suggestEscalation as suggestEscalationAi } from "@/components/notificationIntelligence/aiNotificationFoundation";

const DEFAULT_REPEAT_MINUTES = [3, 10];

export function buildEscalationPlanForPendingItem(
  item: NotificationQueueItem,
): EscalationPlan | null {
  if (item.escalationLevel > 0) {
    return null;
  }

  const nextPriority = item.priority === "high" ? "critical" : "high";
  const nextChannels =
    item.channel === "telegram"
      ? ["in_app", "admin_sound", "email"]
      : ["telegram", "in_app", "admin_sound"];

  return {
    notificationId: item.id,
    nextPriority,
    nextChannels: nextChannels as EscalationPlan["nextChannels"],
    scheduledAt: new Date(Date.now() + 3 * 60_000).toISOString(),
    reason: "Повторное уведомление через 3 минуты с повышением приоритета",
  };
}

export function scheduleEscalationsForEvent(event: NotificationEvent): NotificationQueueItem[] {
  return buildEscalationNotificationsForEvent(event).map((item) =>
    createNotification(item),
  );
}

export function processDueEscalations(now: Date = new Date()): NotificationQueueItem[] {
  const due = listPendingNotifications(now).filter((item) => item.escalationLevel > 0);
  return due;
}

export function getExampleNewOrderEscalation(): {
  initialNotifications: number;
  repeatMinutes: number[];
  escalationAtMinutes: number;
  escalationPriority: string;
} {
  return {
    initialNotifications: 3,
    repeatMinutes: DEFAULT_REPEAT_MINUTES,
    escalationAtMinutes: 10,
    escalationPriority: "critical",
  };
}

export async function applySuggestedEscalation(
  item: NotificationQueueItem,
): Promise<NotificationQueueItem | null> {
  const aiPlan = await suggestEscalationAi(item);
  const plan = aiPlan ?? buildEscalationPlanForPendingItem(item);

  if (!plan) {
    return null;
  }

  const escalated: NotificationQueueItem = {
    ...item,
    id: `${item.id}-escalated-${Date.now()}`,
    priority: plan.nextPriority,
    channel: plan.nextChannels[0] ?? item.channel,
    escalationLevel: item.escalationLevel + 1,
    scheduledAt: plan.scheduledAt,
    status: "pending",
    renderedTitle: `[Escalation] ${item.renderedTitle}`,
    renderedMessage: `${item.renderedMessage}\n\n${plan.reason}`,
    updatedAt: new Date().toISOString(),
  };

  return createNotification(escalated);
}

export function describeEscalationFlow(eventKind: string): string {
  if (eventKind !== "new_order") {
    return "Escalation configured per rule.";
  }

  return [
    "T+0: telegram + in_app + admin_sound",
    "T+3 min: repeat reminder",
    "T+10 min: critical escalation + email",
  ].join(" → ");
}
