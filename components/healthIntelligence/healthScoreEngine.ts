// ==================================================
// SECTION: HEALTH INTELLIGENCE
// РАЗДЕЛ: Health score engine
// ==================================================
import type {
  HealthCheckResult,
  HealthStatus,
  SystemHealthSummary,
} from "@/components/healthIntelligence/healthIntelligenceTypes";

const SEVERITY_PENALTY: Record<HealthCheckResult["severity"], number> = {
  info: 0,
  low: 2,
  medium: 5,
  high: 12,
  critical: 25,
};

export function scoreToHealthStatus(score: number): HealthStatus {
  if (score >= 90) {
    return "healthy";
  }

  if (score >= 70) {
    return "warning";
  }

  if (score >= 40) {
    return "degraded";
  }

  return "critical";
}

export function healthStatusLabel(status: HealthStatus): string {
  switch (status) {
    case "healthy":
      return "Healthy";
    case "warning":
      return "Warning";
    case "degraded":
      return "Degraded";
    case "critical":
      return "Critical";
    case "offline":
      return "Offline";
    default:
      return "Unknown";
  }
}

export function calculateCheckResultsScore(
  results: HealthCheckResult[],
): number {
  if (results.length === 0) {
    return 100;
  }

  let penalty = 0;

  for (const result of results) {
    if (!result.passed) {
      penalty += SEVERITY_PENALTY[result.severity];
    }
  }

  return Math.max(0, Math.min(100, 100 - penalty));
}

export function calculateSystemHealthScore(
  checkResults: HealthCheckResult[],
): number {
  return calculateCheckResultsScore(checkResults);
}

export function buildSystemHealthSummary(
  checkResults: HealthCheckResult[],
  moduleStatuses: Array<{ moduleId: string; status: HealthStatus }>,
): SystemHealthSummary {
  const score = calculateSystemHealthScore(checkResults);
  const status = scoreToHealthStatus(score);

  return {
    status,
    score,
    label: healthStatusLabel(status),
    moduleCount: moduleStatuses.length,
    healthyModules: moduleStatuses.filter((module) => module.status === "healthy")
      .length,
    degradedModules: moduleStatuses.filter(
      (module) => module.status === "degraded" || module.status === "warning",
    ).length,
    criticalModules: moduleStatuses.filter(
      (module) => module.status === "critical" || module.status === "offline",
    ).length,
  };
}

export function getScoreBandLabel(score: number): string {
  if (score >= 90) {
    return "90–100 healthy";
  }

  if (score >= 70) {
    return "70–89 warning";
  }

  if (score >= 40) {
    return "40–69 degraded";
  }

  return "0–39 critical";
}
