// ==================================================
// SECTION: SUPPLIER INTELLIGENCE
// РАЗДЕЛ: Price registry
// ==================================================
import { buildSupplierExampleRegistryState } from "@/components/supplierIntelligence/supplierExamples";
import type {
  SupplierContract,
  SupplierPriceEntry,
  SupplierStockEntry,
  SupplierStockStatus,
} from "@/components/supplierIntelligence/supplierTypes";

export const SUPPLIER_PRICE_STORAGE_KEY =
  "bellaflore_supplier_intelligence_prices_v1";

export const SUPPLIER_STOCK_STORAGE_KEY =
  "bellaflore_supplier_intelligence_stock_v1";

export const SUPPLIER_CONTRACT_STORAGE_KEY =
  "bellaflore_supplier_intelligence_contracts_v1";

let inMemoryPrices: SupplierPriceEntry[] | null = null;
let inMemoryStock: SupplierStockEntry[] | null = null;
let inMemoryContracts: SupplierContract[] | null = null;

function readPricesFromStorage(): SupplierPriceEntry[] {
  if (typeof window === "undefined") {
    return inMemoryPrices ?? buildSupplierExampleRegistryState().prices;
  }

  try {
    const raw = window.localStorage.getItem(SUPPLIER_PRICE_STORAGE_KEY);
    if (!raw) {
      return inMemoryPrices ?? buildSupplierExampleRegistryState().prices;
    }

    const parsed = JSON.parse(raw) as SupplierPriceEntry[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildSupplierExampleRegistryState().prices;
  } catch {
    return inMemoryPrices ?? buildSupplierExampleRegistryState().prices;
  }
}

function writePricesToStorage(prices: SupplierPriceEntry[]): void {
  inMemoryPrices = prices;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SUPPLIER_PRICE_STORAGE_KEY, JSON.stringify(prices));
  } catch {
    // In-memory fallback remains active.
  }
}

function readStockFromStorage(): SupplierStockEntry[] {
  if (typeof window === "undefined") {
    return inMemoryStock ?? buildSupplierExampleRegistryState().stock;
  }

  try {
    const raw = window.localStorage.getItem(SUPPLIER_STOCK_STORAGE_KEY);
    if (!raw) {
      return inMemoryStock ?? buildSupplierExampleRegistryState().stock;
    }

    const parsed = JSON.parse(raw) as SupplierStockEntry[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildSupplierExampleRegistryState().stock;
  } catch {
    return inMemoryStock ?? buildSupplierExampleRegistryState().stock;
  }
}

function writeStockToStorage(stock: SupplierStockEntry[]): void {
  inMemoryStock = stock;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SUPPLIER_STOCK_STORAGE_KEY, JSON.stringify(stock));
  } catch {
    // In-memory fallback remains active.
  }
}

function readContractsFromStorage(): SupplierContract[] {
  if (typeof window === "undefined") {
    return inMemoryContracts ?? buildSupplierExampleRegistryState().contracts;
  }

  try {
    const raw = window.localStorage.getItem(SUPPLIER_CONTRACT_STORAGE_KEY);
    if (!raw) {
      return inMemoryContracts ?? buildSupplierExampleRegistryState().contracts;
    }

    const parsed = JSON.parse(raw) as SupplierContract[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildSupplierExampleRegistryState().contracts;
  } catch {
    return inMemoryContracts ?? buildSupplierExampleRegistryState().contracts;
  }
}

function writeContractsToStorage(contracts: SupplierContract[]): void {
  inMemoryContracts = contracts;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      SUPPLIER_CONTRACT_STORAGE_KEY,
      JSON.stringify(contracts),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function isWithinWindow(validFrom: string, validUntil: string | null, at: Date): boolean {
  const timestamp = at.getTime();
  const starts = new Date(validFrom).getTime();
  const ends = validUntil ? new Date(validUntil).getTime() : null;

  return starts <= timestamp && (ends === null || ends >= timestamp);
}

export function listPurchasePrices(supplierId?: string, at: Date = new Date()): SupplierPriceEntry[] {
  return readPricesFromStorage()
    .filter((p) => (supplierId ? p.supplierId === supplierId : true))
    .filter((p) => isWithinWindow(p.validFrom, p.validUntil, at));
}

export function getPurchasePriceBySku(
  productSku: string,
  supplierId?: string,
): SupplierPriceEntry | null {
  const prices = listPurchasePrices(supplierId).filter((p) => p.productSku === productSku);

  if (prices.length === 0) {
    return null;
  }

  return prices.sort((a, b) => a.purchasePriceRub - b.purchasePriceRub)[0];
}

export function listStockAvailability(supplierId?: string): SupplierStockEntry[] {
  return readStockFromStorage().filter((s) =>
    supplierId ? s.supplierId === supplierId : true,
  );
}

export function getStockBySku(
  productSku: string,
  supplierId?: string,
): SupplierStockEntry | null {
  return (
    listStockAvailability(supplierId).find((s) => s.productSku === productSku) ?? null
  );
}

export function listStockByStatus(status: SupplierStockStatus): SupplierStockEntry[] {
  return readStockFromStorage().filter((s) => s.status === status);
}

export function listLowStockItems(): SupplierStockEntry[] {
  return listStockByStatus("low_stock");
}

export function listOutOfStockItems(): SupplierStockEntry[] {
  return listStockByStatus("out_of_stock");
}

export function listSupplierContracts(
  supplierId?: string,
  activeOnly = false,
): SupplierContract[] {
  return readContractsFromStorage()
    .filter((c) => (supplierId ? c.supplierId === supplierId : true))
    .filter((c) => (activeOnly ? c.status === "active" : true));
}

export function getSupplierContractById(contractId: string): SupplierContract | null {
  return readContractsFromStorage().find((c) => c.id === contractId) ?? null;
}

export function registerPurchasePrice(price: SupplierPriceEntry): SupplierPriceEntry {
  const prices = readPricesFromStorage();
  const index = prices.findIndex((p) => p.id === price.id);
  const next =
    index === -1
      ? [...prices, price]
      : prices.map((p, i) => (i === index ? price : p));

  writePricesToStorage(next);
  return price;
}

export function registerStockEntry(entry: SupplierStockEntry): SupplierStockEntry {
  const stock = readStockFromStorage();
  const index = stock.findIndex((s) => s.id === entry.id);
  const next =
    index === -1 ? [...stock, entry] : stock.map((s, i) => (i === index ? entry : s));

  writeStockToStorage(next);
  return entry;
}

export function registerSupplierContract(contract: SupplierContract): SupplierContract {
  const contracts = readContractsFromStorage();
  const index = contracts.findIndex((c) => c.id === contract.id);
  const next =
    index === -1
      ? [...contracts, contract]
      : contracts.map((c, i) => (i === index ? contract : c));

  writeContractsToStorage(next);
  return contract;
}

export function seedSupplierPriceRegistry(): SupplierPriceEntry[] {
  const seed = buildSupplierExampleRegistryState();
  writePricesToStorage(seed.prices);
  writeStockToStorage(seed.stock);
  writeContractsToStorage(seed.contracts);
  return listPurchasePrices();
}

export function clearSupplierPriceRegistry(): void {
  writePricesToStorage([]);
  writeStockToStorage([]);
  writeContractsToStorage([]);
}

export function comparePurchasePrices(productSku: string): SupplierPriceEntry[] {
  return listPurchasePrices()
    .filter((p) => p.productSku === productSku)
    .sort((a, b) => a.purchasePriceRub - b.purchasePriceRub);
}
