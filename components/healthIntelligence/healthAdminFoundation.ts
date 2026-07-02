// ==================================================
// SECTION: HEALTH INTELLIGENCE
// РАЗДЕЛ: Admin dashboard payload
// ==================================================
import type {
  HealthAdminDashboardPayload,
  HealthSnapshot,
} from "@/components/healthIntelligence/healthIntelligenceTypes";
import { listHealthIncidents } from "@/components/healthIntelligence/healthIncidentFoundation";

export function buildHealthAdminDashboardPayload(
  snapshot: HealthSnapshot,
): HealthAdminDashboardPayload {
  const openIncidents = listHealthIncidents().filter(
    (incident) => incident.status !== "resolved",
  );

  const criticalIssues = snapshot.issues.filter(
    (issue) => issue.severity === "critical" || issue.status === "critical",
  );

  const warnings = snapshot.issues.filter(
    (issue) =>
      issue.severity === "high" ||
      issue.severity === "medium" ||
      issue.status === "warning" ||
      issue.status === "degraded",
  );

  return {
    systemHealthCard: {
      status: snapshot.systemStatus,
      score: snapshot.systemScore,
      lastCheckedAt: snapshot.collectedAt,
    },
    moduleHealthCards: snapshot.moduleStatuses,
    incidents: openIncidents,
    criticalIssues,
    warnings,
    generatedAt: new Date().toISOString(),
  };
}
