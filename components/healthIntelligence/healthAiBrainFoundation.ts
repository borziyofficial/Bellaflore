// ==================================================
// SECTION: HEALTH INTELLIGENCE
// РАЗДЕЛ: AI Brain ready payload
// ==================================================
import type {
  HealthAiBrainPayload,
  HealthIssue,
  HealthSnapshot,
} from "@/components/healthIntelligence/healthIntelligenceTypes";

export function buildHealthAiBrainPayload(
  snapshot: HealthSnapshot,
): HealthAiBrainPayload {
  const criticalIssues = snapshot.issues.filter(
    (issue) => issue.severity === "critical" || issue.severity === "high",
  );

  return {
    healthSignals: snapshot.issues.map((issue) => ({
      id: issue.id,
      title: issue.title,
      severity: issue.severity,
      moduleId: issue.moduleId,
    })),
    healthRisks: criticalIssues.map((issue) => ({
      id: `risk-${issue.id}`,
      title: issue.title,
      severity: issue.severity,
      moduleId: issue.moduleId,
    })),
    healthRecommendations: buildHealthRecommendations(snapshot.issues),
    healthReportSummary: `System health ${snapshot.systemStatus} · score ${snapshot.systemScore} · issues ${snapshot.issues.length}`,
    generatedAt: new Date().toISOString(),
  };
}

function buildHealthRecommendations(issues: HealthIssue[]) {
  const recommendations: HealthAiBrainPayload["healthRecommendations"] = [];

  for (const issue of issues) {
    const recommendation = mapIssueToRecommendation(issue);
    if (recommendation) {
      recommendations.push(recommendation);
    }
  }

  return recommendations.slice(0, 10);
}

function mapIssueToRecommendation(
  issue: HealthIssue,
): HealthAiBrainPayload["healthRecommendations"][number] | null {
  const map: Record<string, { title: string; rationale: string }> = {
    orders_stuck: {
      title: "Review stuck orders",
      rationale: "Orders pending too long without progress",
    },
    orders_failed: {
      title: "Investigate failed orders",
      rationale: "Failed orders require admin attention",
    },
    inventory_out_of_stock: {
      title: "Restock inventory",
      rationale: "Out of stock items block fulfillment",
    },
    courier_no_available: {
      title: "Assign available courier",
      rationale: "No couriers available for delivery",
    },
    delivery_failed: {
      title: "Review failed deliveries",
      rationale: "Failed delivery tasks need resolution",
    },
    notification_failed: {
      title: "Retry failed notifications",
      rationale: "Notification delivery failures detected",
    },
    workflow_failed: {
      title: "Review failed workflow",
      rationale: "Workflow errors block order automation",
    },
    telegram_api_config: {
      title: "Configure Telegram API",
      rationale: "Telegram credentials missing on server",
    },
  };

  const entry = map[issue.checkId];
  if (!entry) {
    return null;
  }

  return {
    id: `health-rec-${issue.id}`,
    title: entry.title,
    rationale: entry.rationale,
    moduleId: issue.moduleId,
  };
}
