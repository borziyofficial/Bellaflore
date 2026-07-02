// ==================================================
// SECTION: AI BRAIN
// РАЗДЕЛ: Public foundation exports
// ==================================================
export type {
  AiBrainContext,
  AiBrainSignal,
  AiBrainSignalKind,
  AiBrainInsight,
  AiBrainRisk,
  AiBrainRiskKind,
  AiBrainRecommendation,
  AiBrainRecommendationKind,
  AiBrainAction,
  AiBrainActionMode,
  AiBrainDecision,
  AiBrainReport,
  AiBrainReportKind,
  AiBrainPriority,
  AiBrainModuleStatus,
  AiBrainModuleId,
  AiBrainAnalysisResult,
  AiBrainProviderKind,
  AiBrainProviderConfig,
  AiBrainProviderCapabilities,
  AiBrainExternalHooks,
  SystemBrainPagePayload,
} from "@/components/aiBrain/aiBrainTypes";

export {
  DEFAULT_AI_BRAIN_ACTION_MODE,
  resolveActionMode,
  buildSafeAiBrainAction,
  enforceSuggestionOnly,
  canAutoExecuteAction,
  requiresAdminConfirmation,
  assertAiBrainReadOnly,
} from "@/components/aiBrain/aiBrainActionSafety";

export {
  AI_BRAIN_PROVIDER_CATALOG,
  registerAiBrainExternalHooks,
  getAiBrainExternalHooks,
  clearAiBrainExternalHooks,
  listAiBrainProviders,
  getAiBrainProvider,
  analyzeWithExternalProvider,
  explainWithExternalProvider,
  AI_BRAIN_PROVIDER_INTEGRATION_SLOTS,
} from "@/components/aiBrain/aiFutureProviderFoundation";

export {
  readAiOrderSnapshot,
  type AiOrderBridgeSnapshot,
} from "@/components/aiBrain/aiOrderBridge";

export {
  readAiInventorySnapshot,
  type AiInventoryBridgeSnapshot,
} from "@/components/aiBrain/aiInventoryBridge";

export {
  readAiCourierSnapshot,
  type AiCourierBridgeSnapshot,
} from "@/components/aiBrain/aiCourierBridge";

export {
  readAiDeliverySnapshot,
  type AiDeliveryBridgeSnapshot,
} from "@/components/aiBrain/aiDeliveryBridge";

export {
  readAiNotificationSnapshot,
  type AiNotificationBridgeSnapshot,
} from "@/components/aiBrain/aiNotificationBridge";

export {
  readAiWorkflowSnapshot,
  type AiWorkflowBridgeSnapshot,
} from "@/components/aiBrain/aiWorkflowBridge";

export {
  readAiAdminSnapshot,
  type AiAdminBridgeSnapshot,
} from "@/components/aiBrain/aiAdminBridge";

export {
  readAiCatalogSnapshot,
  type AiCatalogBridgeSnapshot,
} from "@/components/aiBrain/aiCatalogBridge";

export {
  detectAiBrainSignals,
  resetAiBrainSignalCounter,
  AI_BRAIN_SIGNAL_KINDS,
  type AiBrainBridgeSnapshots,
} from "@/components/aiBrain/aiBrainSignalEngine";

export {
  detectAiBrainRisks,
  resetAiBrainRiskCounter,
  AI_BRAIN_RISK_KINDS,
} from "@/components/aiBrain/aiBrainRiskEngine";

export {
  generateAiBrainRecommendations,
  resetAiBrainRecommendationCounter,
  AI_BRAIN_RECOMMENDATION_KINDS,
} from "@/components/aiBrain/aiBrainRecommendationEngine";

export {
  dailyOperationsReport,
  riskSummaryReport,
  inventoryAttentionReport,
  deliveryPerformanceReport,
  orderDemandReport,
  systemHealthReport,
  generateAllAiBrainReports,
  resetAiBrainReportCounter,
  AI_BRAIN_REPORT_KINDS,
} from "@/components/aiBrain/aiBrainReportEngine";

export {
  collectSystemContext,
  analyzeSystemState,
  detectRisks,
  generateRecommendations,
  createAiBrainReport,
  explainSystemState,
  suggestNextActions,
  getAiBrainExample,
  runAiBrainEngine,
} from "@/components/aiBrain/aiBrainEngine";

export {
  buildSystemBrainPagePayload,
  getSystemBrainPreviewSummary,
} from "@/components/aiBrain/aiBrainSystemBrainFoundation";
