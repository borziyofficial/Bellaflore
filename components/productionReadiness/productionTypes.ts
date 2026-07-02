// ==================================================
// SECTION: PRODUCTION READINESS
// РАЗДЕЛ: Типы
// ==================================================

export type ChecklistCategory =
  | "launch"
  | "environment"
  | "deployment"
  | "backup"
  | "security"
  | "monitoring"
  | "performance"
  | "seo"
  | "telegram"
  | "payment"
  | "admin";

export type ChecklistItemStatus =
  | "pending"
  | "passed"
  | "failed"
  | "skipped"
  | "not_applicable";

export type ChecklistItemPriority = "critical" | "high" | "medium" | "low";

export type GoNoGoDecision = "go" | "no_go" | "conditional_go" | "pending";

export type ProductionRiskLevel = "low" | "moderate" | "elevated" | "high" | "critical";

export type RollbackStepStatus = "ready" | "pending" | "tested";

export type FutureLaunchReportStatus = "draft" | "ready" | "published";

export type ChecklistItem = {
  id: string;
  category: ChecklistCategory;
  title: string;
  description: string;
  status: ChecklistItemStatus;
  priority: ChecklistItemPriority;
  owner: string | null;
  notes: string | null;
  completedAt: string | null;
  updatedAt: string;
};

export type RollbackStep = {
  id: string;
  order: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  status: RollbackStepStatus;
  responsibleRole: string;
};

export type RollbackPlan = {
  id: string;
  title: string;
  description: string;
  triggerConditions: string[];
  steps: RollbackStep[];
  lastTestedAt: string | null;
  updatedAt: string;
};

export type ProductionRiskFactor = {
  id: string;
  label: string;
  description: string;
  weight: number;
  score: number;
  level: ProductionRiskLevel;
  category: ChecklistCategory | "general";
};

export type ProductionRiskScore = {
  totalScore: number;
  maxScore: number;
  normalizedPercent: number;
  level: ProductionRiskLevel;
  factors: ProductionRiskFactor[];
  calculatedAt: string;
};

export type GoNoGoAssessment = {
  decision: GoNoGoDecision;
  rationale: string;
  blockers: string[];
  conditions: string[];
  criticalFailures: number;
  pendingCritical: number;
  assessedAt: string;
};

export type CategoryReadinessSummary = {
  category: ChecklistCategory;
  totalItems: number;
  passedItems: number;
  failedItems: number;
  pendingItems: number;
  readinessPercent: number;
  isReady: boolean;
};

export type FutureLaunchReport = {
  id: string;
  title: string;
  status: FutureLaunchReportStatus;
  summary: string;
  sections: string[];
  targetLaunchDate: string | null;
  generatedAt: string;
};

export type ProductionStatistics = {
  totalChecklistItems: number;
  passedItems: number;
  failedItems: number;
  pendingItems: number;
  overallReadinessPercent: number;
  categoriesReady: number;
  categoriesTotal: number;
  riskLevel: ProductionRiskLevel;
  goNoGoDecision: GoNoGoDecision;
  calculatedAt: string;
};

export type ProductionReadinessSnapshot = {
  checklists: ChecklistItem[];
  categorySummaries: CategoryReadinessSummary[];
  rollbackPlan: RollbackPlan;
  riskScore: ProductionRiskScore;
  goNoGo: GoNoGoAssessment;
  futureLaunchReport: FutureLaunchReport;
  statistics: ProductionStatistics;
  generatedAt: string;
};

export type ChecklistListFilters = {
  category?: ChecklistCategory;
  status?: ChecklistItemStatus;
  priority?: ChecklistItemPriority;
};

export type ProductionRegistryState = {
  checklists: ChecklistItem[];
  rollbackPlan: RollbackPlan;
  riskFactors: ProductionRiskFactor[];
  futureLaunchReport: FutureLaunchReport;
};

export type ProductionReadOnlySummary = {
  checklistCount: number;
  readinessPercent: number;
  riskLevel: ProductionRiskLevel;
  goNoGoDecision: GoNoGoDecision;
};
