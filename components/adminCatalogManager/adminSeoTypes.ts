// ==================================================
// SECTION: Admin Catalog Manager — SEO types
// РАЗДЕЛ: Типы SEO AI Manager
// ==================================================

export type AdminSeoFaqItem = {
  question: string;
  answer: string;
};

export type AdminSeoChecklistItem = {
  id: string;
  label: string;
  passed: boolean;
};

export type AdminSeoDraftFields = {
  seoTitle: string;
  seoDescription: string;
  seoH1: string;
  seoSlug: string;
  seoKeywords: string;
  seoFaq: AdminSeoFaqItem[];
  seoImageAlt: string;
  seoGalleryAlt: string[];
  openGraphTitle: string;
  openGraphDescription: string;
  schemaProductJsonLd: Record<string, unknown>;
  seoScore: number;
  seoRecommendations: string[];
  internalLinkSuggestions: string[];
};

export type MockSeoSuggestion = AdminSeoDraftFields & {
  seoChecklist: AdminSeoChecklistItem[];
};

export type MockSeoSuggestionField = keyof Omit<
  MockSeoSuggestion,
  "seoChecklist" | "seoScore" | "seoRecommendations"
>;

export type AdminProductSeoDraft = import("@/components/catalogEngine/catalogTypes").CatalogAdminSeoDraft;
