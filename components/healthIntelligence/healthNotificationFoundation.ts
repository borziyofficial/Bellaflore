// ==================================================
// SECTION: HEALTH INTELLIGENCE
// РАЗДЕЛ: Notification events foundation (dry-run)
// ==================================================
import type {
  HealthIncident,
  HealthIssue,
  HealthNotificationEvent,
  HealthNotificationEventKind,
  HealthSeverity,
  HealthSnapshot,
} from "@/components/healthIntelligence/healthIntelligenceTypes";
import { scoreToHealthStatus } from "@/components/healthIntelligence/healthScoreEngine";

function buildHealthNotificationEvent(
  kind: HealthNotificationEventKind,
  severity: HealthSeverity,
  title: string,
  message: string,
  incidentId: string | null = null,
  metadata: Record<string, unknown> = {},
): HealthNotificationEvent {
  return {
    kind,
    moduleId: "adminIntelligence",
    severity,
    title,
    message,
    incidentId,
    metadata,
    createdAt: new Date().toISOString(),
  };
}

export function buildHealthWarningNotificationEvent(
  issue: HealthIssue,
): HealthNotificationEvent {
  return buildHealthNotificationEvent(
    "health_warning_detected",
    issue.severity,
    issue.title,
    issue.description,
    null,
    { issueId: issue.id, moduleId: issue.moduleId },
  );
}

export function buildHealthCriticalNotificationEvent(
  issue: HealthIssue,
): HealthNotificationEvent {
  return buildHealthNotificationEvent(
    "health_critical_detected",
    "critical",
    issue.title,
    issue.description,
    null,
    { issueId: issue.id, moduleId: issue.moduleId },
  );
}

export function buildModuleOfflineNotificationEvent(
  moduleId: HealthIssue["moduleId"],
  message: string,
): HealthNotificationEvent {
  return buildHealthNotificationEvent(
    "module_offline_detected",
    "critical",
    `Module offline: ${moduleId}`,
    message,
    null,
    { moduleId },
  );
}

export function buildIncidentEscalatedNotificationEvent(
  incident: HealthIncident,
): HealthNotificationEvent {
  return buildHealthNotificationEvent(
    "incident_escalated",
    incident.severity,
    incident.title,
    incident.description,
    incident.id,
    { moduleId: incident.moduleId },
  );
}

export function buildIncidentResolvedNotificationEvent(
  incident: HealthIncident,
): HealthNotificationEvent {
  return buildHealthNotificationEvent(
    "incident_resolved",
    "info",
    incident.title,
    "Health incident resolved",
    incident.id,
    { moduleId: incident.moduleId },
  );
}

export function buildHealthNotificationEventsFromSnapshot(
  snapshot: HealthSnapshot,
): HealthNotificationEvent[] {
  const events: HealthNotificationEvent[] = [];
  const systemStatus = scoreToHealthStatus(snapshot.systemScore);

  if (systemStatus === "critical") {
    events.push(
      buildHealthNotificationEvent(
        "health_critical_detected",
        "critical",
        "System health critical",
        `Health score: ${snapshot.systemScore}`,
        null,
        { systemScore: snapshot.systemScore },
      ),
    );
  } else if (systemStatus === "warning" || systemStatus === "degraded") {
    events.push(
      buildHealthNotificationEvent(
        "health_warning_detected",
        "high",
        "System health warning",
        `Health score: ${snapshot.systemScore}`,
        null,
        { systemScore: snapshot.systemScore },
      ),
    );
  }

  for (const issue of snapshot.issues) {
    if (issue.severity === "critical") {
      events.push(buildHealthCriticalNotificationEvent(issue));
    } else if (issue.severity === "high" || issue.severity === "medium") {
      events.push(buildHealthWarningNotificationEvent(issue));
    }
  }

  for (const moduleStatus of snapshot.moduleStatuses) {
    if (moduleStatus.status === "offline") {
      events.push(
        buildModuleOfflineNotificationEvent(
          moduleStatus.moduleId,
          `${moduleStatus.title} is offline`,
        ),
      );
    }
  }

  return events;
}

export const HEALTH_NOTIFICATION_EVENT_KINDS: HealthNotificationEventKind[] = [
  "health_warning_detected",
  "health_critical_detected",
  "module_offline_detected",
  "incident_escalated",
  "incident_resolved",
];
