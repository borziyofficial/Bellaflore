// ==================================================
// SECTION: HEALTH INTELLIGENCE
// РАЗДЕЛ: Incident foundation
// ==================================================
import type {
  HealthIncident,
  HealthIssue,
  HealthModuleId,
  HealthSeverity,
} from "@/components/healthIntelligence/healthIntelligenceTypes";

export const HEALTH_INCIDENTS_STORAGE_KEY =
  "bellaflore_health_intelligence_incidents_v1";

let inMemoryIncidents: HealthIncident[] = [];

function generateIncidentId(): string {
  return `health-incident-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readIncidentsFromStorage(): HealthIncident[] {
  if (typeof window === "undefined") {
    return [...inMemoryIncidents];
  }

  try {
    const raw = window.localStorage.getItem(HEALTH_INCIDENTS_STORAGE_KEY);
    if (!raw) {
      return [...inMemoryIncidents];
    }

    const parsed = JSON.parse(raw) as HealthIncident[];
    return Array.isArray(parsed) ? parsed : [...inMemoryIncidents];
  } catch {
    return [...inMemoryIncidents];
  }
}

function writeIncidentsToStorage(incidents: HealthIncident[]): void {
  inMemoryIncidents = [...incidents];

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      HEALTH_INCIDENTS_STORAGE_KEY,
      JSON.stringify(incidents),
    );
  } catch {
    // Incident storage is optional.
  }
}

export function createHealthIncident(input: {
  issue: HealthIssue;
  title?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): HealthIncident {
  const now = new Date().toISOString();
  const incident: HealthIncident = {
    id: generateIncidentId(),
    issueId: input.issue.id,
    moduleId: input.issue.moduleId,
    severity: input.issue.severity,
    status: "open",
    title: input.title ?? input.issue.title,
    description: input.description ?? input.issue.description,
    createdAt: now,
    updatedAt: now,
    acknowledgedAt: null,
    resolvedAt: null,
    escalatedAt: null,
    metadata: input.metadata ?? {},
  };

  const incidents = readIncidentsFromStorage();
  incidents.unshift(incident);
  writeIncidentsToStorage(incidents.slice(0, 200));

  return incident;
}

export function listHealthIncidents(
  status?: HealthIncident["status"],
): HealthIncident[] {
  const incidents = readIncidentsFromStorage();

  if (!status) {
    return incidents;
  }

  return incidents.filter((incident) => incident.status === status);
}

export function getHealthIncidentById(
  incidentId: string,
): HealthIncident | null {
  return readIncidentsFromStorage().find((incident) => incident.id === incidentId) ?? null;
}

export function markIncidentAcknowledged(
  incidentId: string,
): HealthIncident | null {
  return updateIncident(incidentId, (incident) => ({
    ...incident,
    status: "acknowledged",
    acknowledgedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export function escalateHealthIncident(
  incidentId: string,
): HealthIncident | null {
  return updateIncident(incidentId, (incident) => ({
    ...incident,
    status: "escalated",
    escalatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    severity: incident.severity === "critical" ? "critical" : "high",
  }));
}

export function resolveHealthIncident(
  incidentId: string,
): HealthIncident | null {
  return updateIncident(incidentId, (incident) => ({
    ...incident,
    status: "resolved",
    resolvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

function updateIncident(
  incidentId: string,
  updater: (incident: HealthIncident) => HealthIncident,
): HealthIncident | null {
  const incidents = readIncidentsFromStorage();
  const index = incidents.findIndex((incident) => incident.id === incidentId);

  if (index === -1) {
    return null;
  }

  const updated = updater(incidents[index]);
  incidents[index] = updated;
  writeIncidentsToStorage(incidents);

  return updated;
}

export function clearHealthIncidentsStore(): void {
  writeIncidentsToStorage([]);
}

export function getExampleHealthIncident(
  moduleId: HealthModuleId = "workflowIntelligence",
  severity: HealthSeverity = "high",
): HealthIncident {
  const now = new Date().toISOString();

  return {
    id: "health-incident-example",
    issueId: "health-issue-example",
    moduleId,
    severity,
    status: "open",
    title: "Failed workflow detected",
    description: "Workflow завершился с ошибкой и требует review",
    createdAt: now,
    updatedAt: now,
    acknowledgedAt: null,
    resolvedAt: null,
    escalatedAt: null,
    metadata: { example: true },
  };
}
