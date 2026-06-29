// ==================================================
// SECTION: SEO INTELLIGENCE
// РАЗДЕЛ: Foundation types
// ==================================================
import type { ProductEditorDraft } from "@/components/productEditor/productEditorTypes";
import type { PhotoUploadItem } from "@/components/photoManager/photoManagerTypes";

export const SEO_INTELLIGENCE_SECTION_ID = "seo-intelligence";

export type SeoChecklistItem = {
  id: string;
  label: string;
  passed: boolean;
  severity: "critical" | "warning" | "info";
};

export type SeoRecommendation = {
  id: string;
  text: string;
};

export type SeoHealthLevel = "excellent" | "good" | "needs_improvement";

export type SeoLocalFoundation = {
  city: string;
  district: string;
  metro: string;
  okrug: string;
  deliveryZone: string;
  phrase: string;
};

export type SeoHistoryEntry = {
  lastChange: string;
  date: string;
  author: string;
  version: string;
};

export type SeoIntelligenceInput = {
  draft: ProductEditorDraft;
  mainPhoto: PhotoUploadItem | null;
  localSeo: SeoLocalFoundation;
};

export type SeoIntelligenceAnalysis = {
  score: number;
  seoReady: boolean;
  criticalErrors: number;
  warnings: number;
  passedChecks: number;
  checklist: SeoChecklistItem[];
  recommendations: SeoRecommendation[];
  healthLevel: SeoHealthLevel;
  jsonLdPreview: string;
};

export type SeoStructuredDataType = {
  id: string;
  label: string;
  status: "ready" | "planned";
};

export type SeoFutureIntegration = {
  id: string;
  label: string;
};
