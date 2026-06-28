// ==================================================
// SECTION: SECURITY INTELLIGENCE
// РАЗДЕЛ: Health bridge (read-only)
// ==================================================
import { getSystemHealthStatus, collectHealthSnapshot } from "@/components/healthIntelligence/healthIntelligenceEngine";

export function readSecurityHealthSnapshot() {
  const health = getSystemHealthStatus();
  const snapshot = collectHealthSnapshot();

  return {
    systemStatus: health.status,
    systemScore: health.score,
    criticalModules: health.criticalModules,
    openIncidents: snapshot.openIncidents,
    issueCount: snapshot.issues.length,
    generatedAt: new Date().toISOString(),
  };
}
