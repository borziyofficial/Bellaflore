// ==================================================
// SECTION: SUPPLIER INTELLIGENCE
// РАЗДЕЛ: Supplier registry
// ==================================================
import { buildSupplierExampleRegistryState } from "@/components/supplierIntelligence/supplierExamples";
import type {
  Supplier,
  SupplierCategory,
  SupplierListFilters,
  SupplierReliabilityLevel,
} from "@/components/supplierIntelligence/supplierTypes";

export const SUPPLIER_REGISTRY_STORAGE_KEY =
  "bellaflore_supplier_intelligence_registry_v1";

let inMemorySuppliers: Supplier[] | null = null;

function readSuppliersFromStorage(): Supplier[] {
  if (typeof window === "undefined") {
    return inMemorySuppliers ?? buildSupplierExampleRegistryState().suppliers;
  }

  try {
    const raw = window.localStorage.getItem(SUPPLIER_REGISTRY_STORAGE_KEY);
    if (!raw) {
      return inMemorySuppliers ?? buildSupplierExampleRegistryState().suppliers;
    }

    const parsed = JSON.parse(raw) as Supplier[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildSupplierExampleRegistryState().suppliers;
  } catch {
    return inMemorySuppliers ?? buildSupplierExampleRegistryState().suppliers;
  }
}

function writeSuppliersToStorage(suppliers: Supplier[]): void {
  inMemorySuppliers = suppliers;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SUPPLIER_REGISTRY_STORAGE_KEY, JSON.stringify(suppliers));
  } catch {
    // In-memory fallback remains active.
  }
}

function matchesFilters(supplier: Supplier, filters: SupplierListFilters): boolean {
  if (filters.status && supplier.status !== filters.status) {
    return false;
  }

  if (filters.category && !supplier.categories.includes(filters.category)) {
    return false;
  }

  if (filters.isPreferred !== undefined && supplier.isPreferred !== filters.isPreferred) {
    return false;
  }

  if (filters.isBackup !== undefined && supplier.isBackup !== filters.isBackup) {
    return false;
  }

  if (filters.query?.trim()) {
    const q = filters.query.trim().toLowerCase();
    const haystack = `${supplier.name} ${supplier.code} ${supplier.contactName}`.toLowerCase();
    if (!haystack.includes(q)) {
      return false;
    }
  }

  return true;
}

export function resolveReliabilityLevel(score: number): SupplierReliabilityLevel {
  if (score >= 90) {
    return "excellent";
  }

  if (score >= 75) {
    return "good";
  }

  if (score >= 60) {
    return "fair";
  }

  if (score >= 40) {
    return "poor";
  }

  return "critical";
}

export function listSuppliers(filters: SupplierListFilters = {}): Supplier[] {
  return readSuppliersFromStorage()
    .filter((s) => matchesFilters(s, filters))
    .sort((a, b) => b.rating - a.rating);
}

export function getSupplierById(supplierId: string): Supplier | null {
  return readSuppliersFromStorage().find((s) => s.id === supplierId) ?? null;
}

export function getSupplierByCode(code: string): Supplier | null {
  const normalized = code.trim().toUpperCase();
  return (
    readSuppliersFromStorage().find((s) => s.code.toUpperCase() === normalized) ?? null
  );
}

export function listPreferredSuppliers(): Supplier[] {
  return listSuppliers({ isPreferred: true, status: "active" });
}

export function listBackupSuppliers(): Supplier[] {
  return listSuppliers({ isBackup: true, status: "active" });
}

export function listSuppliersByCategory(category: SupplierCategory): Supplier[] {
  return listSuppliers({ category, status: "active" });
}

export function getSupplierRating(supplierId: string): number | null {
  return getSupplierById(supplierId)?.rating ?? null;
}

export function getSupplierReliability(supplierId: string): {
  score: number;
  level: SupplierReliabilityLevel;
} | null {
  const supplier = getSupplierById(supplierId);
  if (!supplier) {
    return null;
  }

  return {
    score: supplier.reliabilityScore,
    level: supplier.reliabilityLevel,
  };
}

export function registerSupplier(supplier: Supplier): Supplier {
  const suppliers = readSuppliersFromStorage();
  const index = suppliers.findIndex((s) => s.id === supplier.id);
  const next =
    index === -1
      ? [...suppliers, supplier]
      : suppliers.map((s, i) => (i === index ? supplier : s));

  writeSuppliersToStorage(next);
  return supplier;
}

export function seedSupplierRegistry(): Supplier[] {
  writeSuppliersToStorage(buildSupplierExampleRegistryState().suppliers);
  return listSuppliers();
}

export function clearSupplierRegistry(): void {
  writeSuppliersToStorage([]);
}

export function findBestSupplierForCategory(
  category: SupplierCategory,
): Supplier | null {
  const candidates = listSuppliersByCategory(category);
  if (candidates.length === 0) {
    return null;
  }

  return candidates.sort((a, b) => {
    if (a.isPreferred !== b.isPreferred) {
      return a.isPreferred ? -1 : 1;
    }

    return b.reliabilityScore - a.reliabilityScore;
  })[0];
}
