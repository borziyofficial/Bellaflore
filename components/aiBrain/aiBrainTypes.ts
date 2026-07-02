// ==================================================
// SECTION: AI BRAIN
// РАЗДЕЛ: Типы
// ==================================================
export type AiBrainPriority = "low" | "normal" | "high" | "critical";

export type AiBrainActionMode =
  | "suggestion_only"
  | "requires_confirmation"
  | "auto_allowed";

export type AiBrainModuleId =
  | "orderIntelligence"
  | "inventoryIntelligence"
  | "courierIntelligence"
  | "deliveryIntelligence"
  | "notificationIntelligence"
  | "workflowIntelligence"
  | "adminIntelligence"
  | "catalogEngine";

export type AiBrainModuleStatus = {
  moduleId: AiBrainModuleId;
  title: string;
  status: "healthy" | "attention" | "degraded" | "unknown";
  priority: AiBrainPriority;
  attentionCount: number;
  summary: string;
  lastCheckedAt: string;
};

export type AiBrainSignalKind =
  | "order_volume_high"
  | "order_not_confirmed"
  | "inventory_low_stock"
  | "inventory_out_of_stock"
  | "courier_overloaded"
  | "delivery_delay_risk"
  | "notification_failed"
  | "workflow_failed"
  | "product_demand_high"
  | "conversion_drop"
  | "system_health_warning";

export type AiBrainSignal = {
  id: string;
  kind: AiBrainSignalKind;
  moduleId: AiBrainModuleId;
  priority: AiBrainPriority;
  title: string;
  message: string;
  resourceType: string | null;
  resourceId: string | null;
  detectedAt: string;
  metadata: Record<string, unknown>;
};

export type AiBrainRiskKind =
  | "delivery_delay"
  | "flower_shortage"
  | "missed_order"
  | "courier_overload"
  | "notification_error"
  | "conversion_drop";

export type AiBrainRisk = {
  id: string;
  kind: AiBrainRiskKind;
  priority: AiBrainPriority;
  title: string;
  description: string;
  moduleId: AiBrainModuleId;
  relatedSignalIds: string[];
  mitigationHints: string[];
  detectedAt: string;
};

export type AiBrainRecommendationKind =
  | "confirm_order"
  | "assign_courier"
  | "restock_inventory"
  | "replace_flower"
  | "retry_notification"
  | "change_delivery_window"
  | "promote_popular_product"
  | "hide_unavailable_product"
  | "review_workflow";

export type AiBrainAction = {
  id: string;
  kind: AiBrainRecommendationKind;
  title: string;
  description: string;
  mode: AiBrainActionMode;
  moduleId: AiBrainModuleId;
  resourceType: string | null;
  resourceId: string | null;
  priority: AiBrainPriority;
};

export type AiBrainRecommendation = {
  id: string;
  kind: AiBrainRecommendationKind;
  priority: AiBrainPriority;
  title: string;
  rationale: string;
  action: AiBrainAction;
  relatedRiskIds: string[];
  relatedSignalIds: string[];
  createdAt: string;
};

export type AiBrainDecision = {
  id: string;
  recommendationId: string;
  action: AiBrainAction;
  approved: boolean;
  decidedAt: string;
  decidedBy: "system" | "admin" | "ai_provider";
  note: string | null;
};

export type AiBrainInsight = {
  id: string;
  category: "operations" | "inventory" | "delivery" | "demand" | "system";
  priority: AiBrainPriority;
  title: string;
  summary: string;
  moduleId: AiBrainModuleId;
  createdAt: string;
};

export type AiBrainContext = {
  collectedAt: string;
  moduleStatuses: AiBrainModuleStatus[];
  moduleSnapshots: Record<AiBrainModuleId, Record<string, unknown>>;
  signalCount: number;
  riskCount: number;
  attentionScore: number;
};

export type AiBrainReportKind =
  | "daily_operations"
  | "risk_summary"
  | "inventory_attention"
  | "delivery_performance"
  | "order_demand"
  | "system_health";

export type AiBrainReport = {
  id: string;
  kind: AiBrainReportKind;
  title: string;
  summary: string;
  priority: AiBrainPriority;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    metrics: Record<string, number | string>;
  }>;
  generatedAt: string;
};

export type AiBrainAnalysisResult = {
  context: AiBrainContext;
  signals: AiBrainSignal[];
  risks: AiBrainRisk[];
  insights: AiBrainInsight[];
  recommendations: AiBrainRecommendation[];
  generatedAt: string;
};

export type AiBrainProviderKind =
  | "openai"
  | "local_model"
  | "admin_rules"
  | "vector_memory";

export type AiBrainProviderCapabilities = {
  canAnalyze: boolean;
  canRecommend: boolean;
  canExplain: boolean;
  canSummarize: boolean;
};

export type AiBrainProviderConfig = {
  kind: AiBrainProviderKind;
  enabled: boolean;
  label: string;
  capabilities: AiBrainProviderCapabilities;
};

export type AiBrainExternalHooks = {
  analyzeWithProvider?: (
    context: AiBrainContext,
    provider: AiBrainProviderKind,
  ) => Promise<AiBrainAnalysisResult | null>;
  explainWithProvider?: (
    context: AiBrainContext,
    provider: AiBrainProviderKind,
  ) => Promise<string | null>;
};

export type SystemBrainPagePayload = {
  routePath: "/admin/system-brain";
  systemState: {
    health: "healthy" | "attention" | "critical";
    attentionScore: number;
    moduleStatuses: AiBrainModuleStatus[];
  };
  risks: AiBrainRisk[];
  recommendations: AiBrainRecommendation[];
  reports: AiBrainReport[];
  suggestedActions: AiBrainAction[];
  generatedAt: string;
};
