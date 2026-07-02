// ==================================================
// SECTION: COURIER INTELLIGENCE
// РАЗДЕЛ: Public foundation exports
// ==================================================
export type {
  CourierOperationalStatus,
  CourierProfile,
  CourierGeoPosition,
  CourierWorkingHours,
  CourierTimelineEvent,
  CourierTimelineEventKind,
  CourierAssignmentRequest,
  CourierAssignmentCandidate,
  CourierAutoAssignmentResult,
  CourierRoutePlan,
  CourierRouteStop,
  CourierStatsSnapshot,
  CourierAdminOverride,
  ManualCourierAssignmentResult,
  AiCourierIntelligenceHooks,
} from "@/components/courierIntelligence/courierIntelligenceTypes";

export {
  COURIER_INTELLIGENCE_CATALOG_SEED,
  getCourierCatalogSeed,
} from "@/components/courierIntelligence/courierCatalog";

export {
  COURIER_INTELLIGENCE_ADMIN_STORAGE_KEY,
  readCourierAdminOverride,
  writeCourierAdminOverride,
  mergeCourierProfilesWithAdmin,
  blockCourierInAdmin,
  unblockCourierInAdmin,
  DEFAULT_COURIER_ADMIN_OVERRIDE,
} from "@/components/courierIntelligence/courierAdminStore";

export {
  createCourierTimelineEvent,
  appendCourierTimelineEvent,
  listCourierTimelineEvents,
  clearCourierTimeline,
} from "@/components/courierIntelligence/courierTimelineEngine";

export {
  scoreCourierForAssignment,
  rankCourierCandidates,
} from "@/components/courierIntelligence/courierScoringEngine";

export {
  autoAssignCourier,
  autoAssignCourierWithAi,
} from "@/components/courierIntelligence/autoAssignmentEngine";

export {
  buildSingleOrderRoute,
  buildMultiOrderRoute,
  estimateRouteArrivalMinutes,
  type RouteStopInput,
} from "@/components/courierIntelligence/routeFoundationEngine";

export {
  listCourierProfiles,
  getCourierProfileById,
  assignCourierManually,
  reassignCourier,
  unassignCourierFromOrder,
  blockCourier,
  unblockCourier,
  getCourierStats,
  readCourierAssignmentRegistry,
  clearCourierAssignmentRegistry,
} from "@/components/courierIntelligence/courierAdminFoundation";

export {
  registerAiCourierIntelligenceHooks,
  getAiCourierIntelligenceHooks,
  clearAiCourierIntelligenceHooks,
  suggestBestCourier,
  predictCourierDelay,
  detectCourierOverload,
  recommendOrderRebalancing,
  AI_COURIER_INTELLIGENCE_INTEGRATION_SLOTS,
} from "@/components/courierIntelligence/aiCourierIntelligenceFoundation";

export {
  mapLegacyCourierToProfile,
  buildAssignmentRequestFromOrderIntelligence,
  suggestCourierForOrderIntelligence,
  buildRoutePlanForCourierOrders,
  listCourierIntelligenceProfiles,
  COURIER_INTELLIGENCE_INTEGRATION_SLOTS,
  type CourierIntelligenceIntegrationSlot,
} from "@/components/courierIntelligence/courierIntelligenceBridge";

export {
  runCourierIntelligenceEngine,
  getCourierIntelligenceExampleAssignment,
} from "@/components/courierIntelligence/courierIntelligenceEngine";
