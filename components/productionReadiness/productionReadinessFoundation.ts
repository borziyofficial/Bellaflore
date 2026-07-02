// ==================================================
// SECTION: PRODUCTION READINESS
// РАЗДЕЛ: Public foundation exports
// ==================================================
export type {
  ChecklistCategory,
  ChecklistItemStatus,
  ChecklistItemPriority,
  GoNoGoDecision,
  ProductionRiskLevel,
  RollbackStepStatus,
  FutureLaunchReportStatus,
  ChecklistItem,
  RollbackStep,
  RollbackPlan,
  ProductionRiskFactor,
  ProductionRiskScore,
  GoNoGoAssessment,
  CategoryReadinessSummary,
  FutureLaunchReport,
  ProductionStatistics,
  ProductionReadinessSnapshot,
  ChecklistListFilters,
  ProductionRegistryState,
  ProductionReadOnlySummary,
} from "@/components/productionReadiness/productionTypes";

export {
  PRODUCTION_EXAMPLE_CHECKLISTS,
  PRODUCTION_EXAMPLE_ROLLBACK_PLAN,
  PRODUCTION_EXAMPLE_RISK_FACTORS,
  PRODUCTION_EXAMPLE_LAUNCH_REPORT,
  buildProductionExampleRegistryState,
} from "@/components/productionReadiness/productionExamples";

export {
  PRODUCTION_CHECKLIST_STORAGE_KEY,
  listChecklistItems,
  getChecklistItemById,
  listChecklistByCategory,
  listPassedChecklistItems,
  listFailedChecklistItems,
  listPendingChecklistItems,
  listCriticalChecklistItems,
  listPendingCriticalItems,
  listFailedCriticalItems,
  calculateCategoryReadiness,
  listAllCategorySummaries,
  calculateOverallReadinessPercent,
  registerChecklistItem,
  updateChecklistItemStatus,
  seedProductionChecklist,
  clearProductionChecklist,
  getLaunchChecklist,
  getEnvironmentChecklist,
  getDeploymentChecklist,
  getBackupChecklist,
  getSecurityChecklist,
  getMonitoringChecklist,
  getPerformanceChecklist,
  getSeoChecklist,
  getTelegramChecklist,
  getPaymentChecklist,
  getAdminChecklist,
  listChecklistCategories,
  countChecklistByPriority,
} from "@/components/productionReadiness/productionChecklist";

export {
  assessEnvironmentReadiness,
  listEnvironmentChecklistItems,
  isEnvironmentReady,
  buildEnvironmentReadinessReport,
  listEnvironmentBlockers,
} from "@/components/productionReadiness/environmentReadinessEngine";

export {
  PRODUCTION_ROLLBACK_STORAGE_KEY,
  assessDeploymentReadiness,
  listDeploymentChecklistItems,
  isDeploymentReady,
  getRollbackPlan,
  listRollbackSteps,
  getRollbackStepById,
  estimateRollbackDurationMinutes,
  registerRollbackPlan,
  seedDeploymentReadiness,
  clearDeploymentReadiness,
  buildDeploymentReadinessReport,
  listDeploymentBlockers,
} from "@/components/productionReadiness/deploymentReadinessEngine";

export {
  assessBackupReadiness,
  listBackupChecklistItems,
  isBackupReady,
  buildBackupReadinessReport,
  listBackupBlockers,
} from "@/components/productionReadiness/backupReadinessEngine";

export {
  assessPerformanceReadiness,
  assessMonitoringReadiness,
  assessSeoReadiness,
  listPerformanceChecklistItems,
  listMonitoringChecklistItems,
  listSeoChecklistItems,
  isPerformanceReady,
  isMonitoringReady,
  isSeoReady,
  buildPerformanceReadinessReport,
  listPerformanceBlockers,
} from "@/components/productionReadiness/performanceReadinessEngine";

export {
  PRODUCTION_READINESS_STORAGE_KEY,
  PRODUCTION_RISK_STORAGE_KEY,
  PRODUCTION_LAUNCH_REPORT_STORAGE_KEY,
  calculateProductionRiskScore,
  assessGoNoGoDecision,
  getFutureLaunchReport,
  registerFutureLaunchReport,
  registerProductionRiskFactor,
  seedLaunchReadiness,
  calculateProductionStatistics,
  buildProductionReadinessSnapshot,
  initializeProductionReadiness,
  getProductionReadinessExample,
  getProductionReadOnlySummary,
  readProductionFoundationCapabilities,
  PRODUCTION_READINESS_ENGINE_SCHEMA,
  listAllProductionFoundationCapabilities,
} from "@/components/productionReadiness/launchReadinessEngine";
