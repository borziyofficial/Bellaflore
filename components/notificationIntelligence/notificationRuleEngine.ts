// ==================================================
// SECTION: NOTIFICATION INTELLIGENCE
// РАЗДЕЛ: Rule engine
// ==================================================
import { getActiveNotificationRules } from "@/components/notificationIntelligence/notificationAdminStore";
import {
  getTemplateForEvent,
  renderNotificationFromTemplate,
} from "@/components/notificationIntelligence/notificationTemplateEngine";
import type {
  NotificationEvent,
  NotificationQueueItem,
  NotificationRecipient,
  NotificationRule,
} from "@/components/notificationIntelligence/notificationIntelligenceTypes";

function buildRecipient(role: NotificationRule["recipientRole"], event: NotificationEvent): NotificationRecipient {
  switch (role) {
    case "customer":
      return {
        role,
        name: String(event.payload.customerName ?? ""),
        phone: String(event.payload.phone ?? ""),
      };
    case "courier":
      return {
        role,
        name: String(event.payload.courierName ?? ""),
        phone: String(event.payload.courierPhone ?? ""),
      };
    case "system":
      return { role, name: "Bellaflore System" };
    default:
      return { role: "admin", name: "Bellaflore Admin" };
  }
}

function createQueueItemId(
  eventId: string,
  ruleId: string,
  channel: string,
  scheduledAt: string,
): string {
  return `NQI-${eventId}-${ruleId}-${channel}-${Date.parse(scheduledAt)}`;
}

function buildQueueItemFromRule(
  event: NotificationEvent,
  rule: NotificationRule,
  channel: NotificationRule["channels"][number],
  scheduledAt: string,
  escalationLevel = 0,
): NotificationQueueItem | null {
  const template = getTemplateForEvent(event.kind);
  if (!template) {
    return null;
  }

  const rendered = renderNotificationFromTemplate(template, event.payload);
  const now = new Date().toISOString();

  return {
    id: createQueueItemId(event.id, rule.id, channel, scheduledAt),
    eventId: event.id,
    ruleId: rule.id,
    eventKind: event.kind,
    channel,
    recipient: buildRecipient(rule.recipientRole, event),
    priority: escalationLevel > 0 && rule.escalateToPriority
      ? rule.escalateToPriority
      : rule.priority,
    status: "pending",
    templateId: template.id,
    renderedTitle: rendered.title,
    renderedMessage: rendered.message,
    payload: event.payload,
    scheduledAt,
    sentAt: null,
    failedAt: null,
    cancelledAt: null,
    retryCount: 0,
    escalationLevel,
    lastError: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function resolveRulesForEvent(event: NotificationEvent): NotificationRule[] {
  return getActiveNotificationRules().filter((rule) => rule.eventKind === event.kind);
}

export function buildNotificationsFromEvent(
  event: NotificationEvent,
  now: Date = new Date(),
): NotificationQueueItem[] {
  const rules = resolveRulesForEvent(event);
  const items: NotificationQueueItem[] = [];

  for (const rule of rules) {
    for (const channel of rule.channels) {
      const immediate = buildQueueItemFromRule(
        event,
        rule,
        channel,
        now.toISOString(),
        0,
      );

      if (immediate) {
        items.push(immediate);
      }
    }

    for (const repeatMinutes of rule.repeatAfterMinutes) {
      const scheduledAt = new Date(now.getTime() + repeatMinutes * 60_000).toISOString();

      for (const channel of rule.channels) {
        const repeated = buildQueueItemFromRule(
          event,
          rule,
          channel,
          scheduledAt,
          0,
        );

        if (repeated) {
          items.push({
            ...repeated,
            id: `${repeated.id}-repeat-${repeatMinutes}`,
            retryCount: 1,
          });
        }
      }
    }
  }

  return items;
}

export function buildEscalationNotificationsForEvent(
  event: NotificationEvent,
  now: Date = new Date(),
): NotificationQueueItem[] {
  const rules = resolveRulesForEvent(event).filter(
    (rule) => rule.escalateAfterMinutes != null && rule.escalateToPriority,
  );

  const items: NotificationQueueItem[] = [];

  for (const rule of rules) {
    const scheduledAt = new Date(
      now.getTime() + (rule.escalateAfterMinutes ?? 0) * 60_000,
    ).toISOString();
    const channels =
      rule.escalateToChannels.length > 0
        ? rule.escalateToChannels
        : rule.channels;

    for (const channel of channels) {
      const escalated = buildQueueItemFromRule(
        event,
        rule,
        channel,
        scheduledAt,
        1,
      );

      if (escalated) {
        items.push({
          ...escalated,
          id: `${escalated.id}-escalation`,
        });
      }
    }
  }

  return items;
}

export function processNotificationEvent(
  event: NotificationEvent,
  now: Date = new Date(),
): NotificationQueueItem[] {
  return [
    ...buildNotificationsFromEvent(event, now),
    ...buildEscalationNotificationsForEvent(event, now),
  ];
}
