// ==================================================
// SECTION: CATALOG ENGINE
// РАЗДЕЛ: Smart Catalog — типы
// ==================================================

export type CatalogAdminSeoDraft = {
  seoH1?: string;
  seoSlug?: string;
  seoKeywords?: string[];
  seoFaq?: Array<{ question: string; answer: string }>;
  seoGalleryAlt?: string[];
  openGraphTitle?: string;
  openGraphDescription?: string;
  schemaProductJsonLd?: Record<string, unknown>;
  seoScore?: number;
  seoRecommendations?: string[];
  internalLinkSuggestions?: string[];
};

export type CatalogProductSizeId = "S" | "M" | "L" | "XL";

export type ProductAvailabilityStatus =
  | "in_stock"
  | "out_of_stock"
  | "coming_soon"
  | "made_to_order";

export type CatalogProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

export type CatalogFilterKind =
  | "price"
  | "size"
  | "color"
  | "flower"
  | "occasion"
  | "season"
  | "popular"
  | "new";

export type CatalogSearchProvider = "local" | "ai" | "hybrid";

export type CatalogAiCapability =
  | "catalog"
  | "recommendations"
  | "search"
  | "promotions";

export type CatalogProductImage = {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
  sortOrder: number;
  isPrimary: boolean;
};

export type CatalogProductSize = {
  sizeId: CatalogProductSizeId;
  priceRub: number;
  isActive: boolean;
  stemCount?: number;
  description?: string;
};

export type CatalogProductRecommendations = {
  similarProductIds: string[];
  premiumAlternativeIds: string[];
  budgetAlternativeIds: string[];
  frequentlyBoughtTogetherIds: string[];
};

export type CatalogProductSeo = {
  title: string;
  description: string;
  slug: string;
  canonicalPath: string;
  schemaType: "Product";
  schemaJsonLd: Record<string, unknown>;
  openGraph: {
    title: string;
    description: string;
    imageUrl: string;
    type: "product";
    locale: string;
  };
};

export type CatalogProductRecord = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  categoryIds: string[];
  tags: string[];
  colors: string[];
  flowerTypes: string[];
  occasions: string[];
  seasons: string[];
  sizes: CatalogProductSize[];
  images: CatalogProductImage[];
  basePriceRub: number;
  availability: ProductAvailabilityStatus;
  status: CatalogProductStatus;
  isPublished: boolean;
  isFeatured: boolean;
  isNew: boolean;
  popularityScore: number;
  seasonalScore: number;
  addOnIds: string[];
  recommendations: CatalogProductRecommendations;
  seo: CatalogProductSeo;
  searchTerms: string[];
  searchIndexText: string;
  metadata: {
    catalogVersion: string;
    createdAt: string;
    updatedAt: string;
    legacyCategory?: string;
    stemCount?: number;
    composition?: string;
    isBestseller?: boolean;
    adminCreated?: boolean;
    adminSeoDraft?: CatalogAdminSeoDraft;
  };
};

export type CatalogCategoryRecord = {
  id: string;
  slug: string;
  title: string;
  description: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  isSeasonal: boolean;
  icon?: string;
  seo: Pick<CatalogProductSeo, "title" | "description" | "slug">;
};

export type CatalogFilterOption = {
  id: string;
  label: string;
  kind: CatalogFilterKind;
  value: string | number | boolean;
  queryToken?: string;
};

export type CatalogFilterDefinition = {
  kind: CatalogFilterKind;
  label: string;
  options: CatalogFilterOption[];
  multiSelect: boolean;
};

export type CatalogFilterState = Partial<
  Record<CatalogFilterKind, string | string[] | number | boolean>
>;

export type CatalogSearchQuery = {
  text: string;
  filters?: CatalogFilterState;
  categoryId?: string | null;
  provider?: CatalogSearchProvider;
  limit?: number;
};

export type CatalogSearchHit = {
  productId: string;
  score: number;
  matchedTerms: string[];
  provider: CatalogSearchProvider;
};

export type CatalogSearchResult = {
  hits: CatalogSearchHit[];
  products: CatalogProductRecord[];
  provider: CatalogSearchProvider;
  tookMs: number;
};

export type CatalogRecommendationKind =
  | "similar"
  | "premium"
  | "budget"
  | "bought_together";

export type CatalogRecommendationResult = {
  kind: CatalogRecommendationKind;
  productIds: string[];
  products: CatalogProductRecord[];
};

export type CatalogEngineSnapshot = {
  products: CatalogProductRecord[];
  categories: CatalogCategoryRecord[];
  version: string;
  updatedAt: string;
};

export type CatalogProductUpsertInput = Omit<
  CatalogProductRecord,
  "searchIndexText" | "metadata"
> & {
  metadata?: Partial<CatalogProductRecord["metadata"]>;
};

export type CatalogAdminPatch = {
  products?: CatalogProductRecord[];
  categories?: CatalogCategoryRecord[];
  version?: string;
  updatedAt?: string;
};

export type CatalogAiHookRegistry = {
  catalog?: (snapshot: CatalogEngineSnapshot) => Promise<CatalogEngineSnapshot>;
  recommendations?: (
    productId: string,
    kind: CatalogRecommendationKind,
  ) => Promise<string[]>;
  search?: (query: CatalogSearchQuery) => Promise<CatalogSearchHit[]>;
  promotions?: (
    productIds: string[],
  ) => Promise<Record<string, number>>;
};
