// ==================================================
// SECTION: FINANCE INTELLIGENCE
// РАЗДЕЛ: Expense registry
// ==================================================
import { buildFinanceExampleRegistryState } from "@/components/financeIntelligence/financeExamples";
import type {
  CashFlowEntry,
  CourierCostEntry,
  ExpenseEntry,
  ExpenseKind,
  ExpenseListFilters,
  OperationalExpenseSummary,
  RefundEntry,
  SupplierCostEntry,
} from "@/components/financeIntelligence/financeTypes";

export const FINANCE_EXPENSE_STORAGE_KEY =
  "bellaflore_finance_intelligence_expense_v1";

export const FINANCE_REFUND_STORAGE_KEY =
  "bellaflore_finance_intelligence_refund_v1";

export const FINANCE_CASH_FLOW_STORAGE_KEY =
  "bellaflore_finance_intelligence_cash_flow_v1";

export const FINANCE_COURIER_COST_STORAGE_KEY =
  "bellaflore_finance_intelligence_courier_cost_v1";

export const FINANCE_SUPPLIER_COST_STORAGE_KEY =
  "bellaflore_finance_intelligence_supplier_cost_v1";

export const FINANCE_OPERATIONAL_STORAGE_KEY =
  "bellaflore_finance_intelligence_operational_v1";

let inMemoryExpenses: ExpenseEntry[] | null = null;
let inMemoryRefunds: RefundEntry[] | null = null;
let inMemoryCashFlow: CashFlowEntry[] | null = null;
let inMemoryCourierCosts: CourierCostEntry[] | null = null;
let inMemorySupplierCosts: SupplierCostEntry[] | null = null;
let inMemoryOperational: OperationalExpenseSummary[] | null = null;

function readExpensesFromStorage(): ExpenseEntry[] {
  if (typeof window === "undefined") {
    return inMemoryExpenses ?? buildFinanceExampleRegistryState().expenses;
  }

  try {
    const raw = window.localStorage.getItem(FINANCE_EXPENSE_STORAGE_KEY);
    if (!raw) {
      return inMemoryExpenses ?? buildFinanceExampleRegistryState().expenses;
    }

    const parsed = JSON.parse(raw) as ExpenseEntry[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildFinanceExampleRegistryState().expenses;
  } catch {
    return inMemoryExpenses ?? buildFinanceExampleRegistryState().expenses;
  }
}

function writeExpensesToStorage(entries: ExpenseEntry[]): void {
  inMemoryExpenses = entries;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(FINANCE_EXPENSE_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // In-memory fallback remains active.
  }
}

function readRefundsFromStorage(): RefundEntry[] {
  if (typeof window === "undefined") {
    return inMemoryRefunds ?? buildFinanceExampleRegistryState().refunds;
  }

  try {
    const raw = window.localStorage.getItem(FINANCE_REFUND_STORAGE_KEY);
    if (!raw) {
      return inMemoryRefunds ?? buildFinanceExampleRegistryState().refunds;
    }

    const parsed = JSON.parse(raw) as RefundEntry[];
    return Array.isArray(parsed) ? parsed : buildFinanceExampleRegistryState().refunds;
  } catch {
    return inMemoryRefunds ?? buildFinanceExampleRegistryState().refunds;
  }
}

function writeRefundsToStorage(entries: RefundEntry[]): void {
  inMemoryRefunds = entries;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(FINANCE_REFUND_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // In-memory fallback remains active.
  }
}

function readCashFlowFromStorage(): CashFlowEntry[] {
  if (typeof window === "undefined") {
    return inMemoryCashFlow ?? buildFinanceExampleRegistryState().cashFlow;
  }

  try {
    const raw = window.localStorage.getItem(FINANCE_CASH_FLOW_STORAGE_KEY);
    if (!raw) {
      return inMemoryCashFlow ?? buildFinanceExampleRegistryState().cashFlow;
    }

    const parsed = JSON.parse(raw) as CashFlowEntry[];
    return Array.isArray(parsed) ? parsed : buildFinanceExampleRegistryState().cashFlow;
  } catch {
    return inMemoryCashFlow ?? buildFinanceExampleRegistryState().cashFlow;
  }
}

function writeCashFlowToStorage(entries: CashFlowEntry[]): void {
  inMemoryCashFlow = entries;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(FINANCE_CASH_FLOW_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // In-memory fallback remains active.
  }
}

function readCourierCostsFromStorage(): CourierCostEntry[] {
  if (typeof window === "undefined") {
    return inMemoryCourierCosts ?? buildFinanceExampleRegistryState().courierCosts;
  }

  try {
    const raw = window.localStorage.getItem(FINANCE_COURIER_COST_STORAGE_KEY);
    if (!raw) {
      return inMemoryCourierCosts ?? buildFinanceExampleRegistryState().courierCosts;
    }

    const parsed = JSON.parse(raw) as CourierCostEntry[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildFinanceExampleRegistryState().courierCosts;
  } catch {
    return inMemoryCourierCosts ?? buildFinanceExampleRegistryState().courierCosts;
  }
}

function writeCourierCostsToStorage(entries: CourierCostEntry[]): void {
  inMemoryCourierCosts = entries;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(FINANCE_COURIER_COST_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // In-memory fallback remains active.
  }
}

function readSupplierCostsFromStorage(): SupplierCostEntry[] {
  if (typeof window === "undefined") {
    return inMemorySupplierCosts ?? buildFinanceExampleRegistryState().supplierCosts;
  }

  try {
    const raw = window.localStorage.getItem(FINANCE_SUPPLIER_COST_STORAGE_KEY);
    if (!raw) {
      return inMemorySupplierCosts ?? buildFinanceExampleRegistryState().supplierCosts;
    }

    const parsed = JSON.parse(raw) as SupplierCostEntry[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildFinanceExampleRegistryState().supplierCosts;
  } catch {
    return inMemorySupplierCosts ?? buildFinanceExampleRegistryState().supplierCosts;
  }
}

function writeSupplierCostsToStorage(entries: SupplierCostEntry[]): void {
  inMemorySupplierCosts = entries;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(FINANCE_SUPPLIER_COST_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // In-memory fallback remains active.
  }
}

function readOperationalFromStorage(): OperationalExpenseSummary[] {
  if (typeof window === "undefined") {
    return inMemoryOperational ?? buildFinanceExampleRegistryState().operationalExpenses;
  }

  try {
    const raw = window.localStorage.getItem(FINANCE_OPERATIONAL_STORAGE_KEY);
    if (!raw) {
      return inMemoryOperational ?? buildFinanceExampleRegistryState().operationalExpenses;
    }

    const parsed = JSON.parse(raw) as OperationalExpenseSummary[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildFinanceExampleRegistryState().operationalExpenses;
  } catch {
    return inMemoryOperational ?? buildFinanceExampleRegistryState().operationalExpenses;
  }
}

function writeOperationalToStorage(entries: OperationalExpenseSummary[]): void {
  inMemoryOperational = entries;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(FINANCE_OPERATIONAL_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // In-memory fallback remains active.
  }
}

function matchesExpenseFilters(entry: ExpenseEntry, filters: ExpenseListFilters): boolean {
  if (filters.kind && entry.kind !== filters.kind) {
    return false;
  }

  if (filters.supplierId && entry.supplierId !== filters.supplierId) {
    return false;
  }

  if (filters.courierId && entry.courierId !== filters.courierId) {
    return false;
  }

  if (filters.from && new Date(entry.occurredAt) < new Date(filters.from)) {
    return false;
  }

  if (filters.to && new Date(entry.occurredAt) > new Date(filters.to)) {
    return false;
  }

  return true;
}

export function listExpenseEntries(filters: ExpenseListFilters = {}): ExpenseEntry[] {
  return readExpensesFromStorage()
    .filter((e) => matchesExpenseFilters(e, filters))
    .sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
}

export function getExpenseById(expenseId: string): ExpenseEntry | null {
  return readExpensesFromStorage().find((e) => e.id === expenseId) ?? null;
}

export function listExpensesByKind(kind: ExpenseKind): ExpenseEntry[] {
  return listExpenseEntries({ kind });
}

export function calculateTotalExpenses(filters: ExpenseListFilters = {}): number {
  return listExpenseEntries(filters).reduce((sum, e) => sum + e.amountRub, 0);
}

export function listCourierCosts(periodLabel?: string): CourierCostEntry[] {
  return readCourierCostsFromStorage().filter((c) =>
    periodLabel ? c.periodLabel === periodLabel : true,
  );
}

export function listSupplierCosts(periodLabel?: string): SupplierCostEntry[] {
  return readSupplierCostsFromStorage().filter((c) =>
    periodLabel ? c.periodLabel === periodLabel : true,
  );
}

export function listOperationalExpenses(periodLabel?: string): OperationalExpenseSummary[] {
  return readOperationalFromStorage().filter((e) =>
    periodLabel ? e.periodLabel === periodLabel : true,
  );
}

export function listRefunds(status?: RefundEntry["status"]): RefundEntry[] {
  const entries = readRefundsFromStorage();

  return (status ? entries.filter((r) => r.status === status) : entries).sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}

export function getRefundById(refundId: string): RefundEntry | null {
  return readRefundsFromStorage().find((r) => r.id === refundId) ?? null;
}

export function listCashFlow(from?: string, to?: string): CashFlowEntry[] {
  return readCashFlowFromStorage()
    .filter((e) => {
      if (from && new Date(e.occurredAt) < new Date(from)) {
        return false;
      }

      if (to && new Date(e.occurredAt) > new Date(to)) {
        return false;
      }

      return true;
    })
    .sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
}

export function calculateCashFlowBalance(from?: string, to?: string): number {
  return listCashFlow(from, to).reduce((balance, e) => {
    return e.direction === "inflow" ? balance + e.amountRub : balance - e.amountRub;
  }, 0);
}

export function registerExpenseEntry(entry: ExpenseEntry): ExpenseEntry {
  const entries = readExpensesFromStorage();
  const index = entries.findIndex((e) => e.id === entry.id);
  const next =
    index === -1
      ? [...entries, entry]
      : entries.map((e, i) => (i === index ? entry : e));

  writeExpensesToStorage(next);
  return entry;
}

export function registerRefundEntry(entry: RefundEntry): RefundEntry {
  const entries = readRefundsFromStorage();
  const index = entries.findIndex((r) => r.id === entry.id);
  const next =
    index === -1
      ? [...entries, entry]
      : entries.map((r, i) => (i === index ? entry : r));

  writeRefundsToStorage(next);
  return entry;
}

export function registerCashFlowEntry(entry: CashFlowEntry): CashFlowEntry {
  writeCashFlowToStorage([entry, ...readCashFlowFromStorage()]);
  return entry;
}

export function seedExpenseRegistry(): ExpenseEntry[] {
  const seed = buildFinanceExampleRegistryState();
  writeExpensesToStorage(seed.expenses);
  writeRefundsToStorage(seed.refunds);
  writeCashFlowToStorage(seed.cashFlow);
  writeCourierCostsToStorage(seed.courierCosts);
  writeSupplierCostsToStorage(seed.supplierCosts);
  writeOperationalToStorage(seed.operationalExpenses);
  return listExpenseEntries();
}

export function clearExpenseRegistry(): void {
  writeExpensesToStorage([]);
  writeRefundsToStorage([]);
  writeCashFlowToStorage([]);
  writeCourierCostsToStorage([]);
  writeSupplierCostsToStorage([]);
  writeOperationalToStorage([]);
}
