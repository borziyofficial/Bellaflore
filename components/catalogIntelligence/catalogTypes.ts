// ==================================================
// SECTION: CATALOG INTELLIGENCE
// РАЗДЕЛ: Типы
// ==================================================

export type CatalogSeason = "spring" | "summer" | "autumn" | "winter";

export type CatalogAvailabilityStatus =
  | "in_stock"
  | "low_stock"
  | "out_of_stock"
  | "preorder"
  | "seasonal";

export type CatalogProductStatus = "draft" | "published" | "archived";

export type CatalogFilterKind =
  | "category"
  | "color"
  | "flower"
  | "price"
  | "occasion"
  | "season"
  | "availability"
  | "tag";

export type CatalogCollectionKind =
  | "smart"
  | "manual"
  | "seasonal"
  | "featured"
  | "popular";

export type CatalogAiSuggestionStatus = "suggestion_only";

export type CatalogSmartCategory = {
  id: string;
  slug: string;
  title: string;
  description: string;
  ruleTags: string[];
  ruleCategoryIds: string[];
  ruleSeasons: CatalogSeason[];
  productIds: string[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CatalogSmartCollection = {
  id: string;
  slug: string;
  title: string;
  description: string;
  kind: CatalogCollectionKind;
  productIds: string[];
  categoryIds: string[];
  season: CatalogSeason | null;
  badge: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CatalogProductGroup = {
  id: string;
  title: string;
  description: string;
  productIds: string[];
  leaderProductId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type CatalogProductRecord = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  categoryIds: string[];
  groupId: string | null;
  tags: string[];
  colors: string[];
  flowerTypes: string[];
  occasions: string[];
  seasons: CatalogSeason[];
  basePriceRub: number;
  popularityScore: number;
  seasonalScore: number;
  availability: CatalogAvailabilityStatus;
  status: CatalogProductStatus;
  isFeatured: boolean;
  isSeasonal: boolean;
  relatedProductIds: string[];
  similarProductIds: string[];
  searchTerms: string[];
  createdAt: string;
  updatedAt: string;
};

export type CatalogCategoryRecord = {
  id: string;
  slug: string;
  title: string;
  description: string;
  parentId: string | null;
  productCount: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CatalogSearchIndexEntry = {
  id: string;
  productId: string;
  token: string;
  weight: number;
  source: "title" | "tag" | "flower" | "color" | "occasion" | "category";
  updatedAt: string;
};

export type CatalogFilterOption = {
  id: string;
  kind: CatalogFilterKind;
  label: string;
  value: string;
  count: number;
};

export type CatalogFilterGroup = {
  kind: CatalogFilterKind;
  label: string;
  options: CatalogFilterOption[];
};

export type CatalogAvailabilityEntry = {
  productId: string;
  status: CatalogAvailabilityStatus;
  stockHint: number | null;
  restockEta: string | null;
  updatedAt: string;
};

export type CatalogFeaturedEntry = {
  productId: string;
  badge: string | null;
  sortOrder: number;
  highlightUntil: string | null;
  collectionId: string | null;
};

export type CatalogAiProductSuggestion = {
  id: string;
  productId: string;
  title: string;
  rationale: string;
  confidence: number;
  status: CatalogAiSuggestionStatus;
  createdAt: string;
};

export type CatalogStatistics = {
  totalProducts: number;
  publishedProducts: number;
  featuredProducts: number;
  seasonalProducts: number;
  outOfStockProducts: number;
  averagePriceRub: number;
  topCategoryId: string | null;
  topFlowerType: string | null;
  searchIndexSize: number;
  calculatedAt: string;
};

export type CatalogIntelligenceSnapshot = {
  categories: CatalogSmartCategory[];
  collections: CatalogSmartCollection[];
  productGroups: CatalogProductGroup[];
  products: CatalogProductRecord[];
  featured: CatalogFeaturedEntry[];
  availability: CatalogAvailabilityEntry[];
  searchIndex: CatalogSearchIndexEntry[];
  filters: CatalogFilterGroup[];
  aiSuggestions: CatalogAiProductSuggestion[];
  statistics: CatalogStatistics;
  generatedAt: string;
};

export type CatalogListFilters = {
  categoryId?: string;
  season?: CatalogSeason;
  availability?: CatalogAvailabilityStatus;
  query?: string;
  isFeatured?: boolean;
  isSeasonal?: boolean;
};

export type CatalogRegistryState = {
  categories: CatalogSmartCategory[];
  collections: CatalogSmartCollection[];
  productGroups: CatalogProductGroup[];
  products: CatalogProductRecord[];
  featured: CatalogFeaturedEntry[];
  availability: CatalogAvailabilityEntry[];
  searchIndex: CatalogSearchIndexEntry[];
  aiSuggestions: CatalogAiProductSuggestion[];
};

export type CatalogReadOnlySummary = {
  productCount: number;
  categoryCount: number;
  collectionCount: number;
  featuredCount: number;
  seasonalCount: number;
  inStockCount: number;
};

export type CatalogRelatedProductsResult = {
  productId: string;
  related: CatalogProductRecord[];
  similar: CatalogProductRecord[];
};

export type CatalogSearchResult = {
  product: CatalogProductRecord;
  score: number;
  matchedTokens: string[];
};
