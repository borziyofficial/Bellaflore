// ==================================================
// SECTION: SECURITY INTELLIGENCE
// РАЗДЕЛ: Admin bridge (read-only)
// ==================================================
import { getAdminIntelligenceSnapshot } from "@/components/adminIntelligence/adminIntelligenceEngine";

export function readSecurityAdminSnapshot() {
  const snapshot = getAdminIntelligenceSnapshot();

  return {
    sessionPresent: Boolean(snapshot.session),
    entryPointCount: snapshot.entryPoints.length,
    accessibleEntryPoints: snapshot.accessibleEntryPoints.length,
    attentionItems: snapshot.dashboard.attentionItemsCount,
    generatedAt: new Date().toISOString(),
  };
}
