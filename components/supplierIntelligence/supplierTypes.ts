// ==================================================
// SECTION: SUPPLIER INTELLIGENCE
// РАЗДЕЛ: Типы
// ==================================================

export type SupplierStatus = "active" | "paused" | "blocked" | "pending";

export type SupplierReliabilityLevel = "excellent" | "good" | "fair" | "poor" | "critical";

export type SupplierContractStatus = "draft" | "active" | "expired" | "terminated";

export type SupplierStockStatus = "in_stock" | "low_stock" | "out_of_stock" | "preorder";

export type SupplierAiPreparationStatus = "suggestion_only";

export type SupplierCategory =
  | "flowers"
  | "greenery"
  | "packaging"
  | "add_ons"
  | "consumables";

export type Supplier = {
  id: string;
  name: string;
  code: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  categories: SupplierCategory[];
  rating: number;
  reliabilityScore: number;
  reliabilityLevel: SupplierReliabilityLevel;
  isPreferred: boolean;
  isBackup: boolean;
  status: SupplierStatus;
  deliveryTimeDays: number;
  minOrderRub: number | null;
  notes: string[];
  createdAt: string;
  updatedAt: string;
};

export type SupplierPriceEntry = {
  id: string;
  supplierId: string;
  productSku: string;
  productTitle: string;
  unit: string;
  purchasePriceRub: number;
  minQuantity: number;
  validFrom: string;
  validUntil: string | null;
  updatedAt: string;
};

export type SupplierDeliverySchedule = {
  id: string;
  supplierId: string;
  zoneLabel: string;
  deliveryDays: number;
  cutoffHour: number;
  deliveryFeeRub: number;
  isActive: boolean;
  updatedAt: string;
};

export type SupplierStockEntry = {
  id: string;
  supplierId: string;
  productSku: string;
  productTitle: string;
  availableQuantity: number;
  status: SupplierStockStatus;
  restockEta: string | null;
  updatedAt: string;
};

export type SupplierContract = {
  id: string;
  supplierId: string;
  title: string;
  status: SupplierContractStatus;
  startDate: string;
  endDate: string | null;
  paymentTermsDays: number;
  discountPercent: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SupplierHistoryEntry = {
  id: string;
  supplierId: string;
  kind: "order" | "delivery" | "price_change" | "rating_change" | "contract" | "note";
  title: string;
  message: string;
  amountRub: number | null;
  occurredAt: string;
};

export type SupplierAnalyticsMetric = {
  supplierId: string;
  totalOrders: number;
  totalSpendRub: number;
  onTimeDeliveryRate: number;
  averageDeliveryDays: number;
  priceStabilityScore: number;
  stockAvailabilityRate: number;
  calculatedAt: string;
};

export type SupplierAiPreparation = {
  id: string;
  title: string;
  rationale: string;
  suggestedAction: string;
  targetSupplierId: string | null;
  confidence: number;
  status: SupplierAiPreparationStatus;
  createdAt: string;
};

export type SupplierStatistics = {
  totalSuppliers: number;
  activeSuppliers: number;
  preferredSuppliers: number;
  backupSuppliers: number;
  averageRating: number;
  averageReliabilityScore: number;
  activeContracts: number;
  lowStockItems: number;
  calculatedAt: string;
};

export type SupplierIntelligenceSnapshot = {
  suppliers: Supplier[];
  prices: SupplierPriceEntry[];
  deliverySchedules: SupplierDeliverySchedule[];
  stock: SupplierStockEntry[];
  contracts: SupplierContract[];
  history: SupplierHistoryEntry[];
  analytics: SupplierAnalyticsMetric[];
  aiPreparations: SupplierAiPreparation[];
  statistics: SupplierStatistics;
  generatedAt: string;
};

export type SupplierListFilters = {
  status?: SupplierStatus;
  category?: SupplierCategory;
  isPreferred?: boolean;
  isBackup?: boolean;
  query?: string;
};

export type SupplierRegistryState = {
  suppliers: Supplier[];
  prices: SupplierPriceEntry[];
  deliverySchedules: SupplierDeliverySchedule[];
  stock: SupplierStockEntry[];
  contracts: SupplierContract[];
  history: SupplierHistoryEntry[];
  analytics: SupplierAnalyticsMetric[];
  aiPreparations: SupplierAiPreparation[];
};

export type SupplierReadOnlySummary = {
  supplierCount: number;
  preferredCount: number;
  backupCount: number;
  contractCount: number;
  lowStockCount: number;
};
