// ==================================================
// SECTION: CRM INTELLIGENCE
// РАЗДЕЛ: Customer registry
// ==================================================
import { buildCrmExampleRegistryState } from "@/components/crmIntelligence/crmExamples";
import type {
  CrmCustomerProfile,
  CrmListFilters,
  CrmVipLevel,
} from "@/components/crmIntelligence/crmTypes";

export const CRM_CUSTOMERS_STORAGE_KEY =
  "bellaflore_crm_intelligence_customers_v1";

let inMemoryCustomers: CrmCustomerProfile[] | null = null;

function readCustomersFromStorage(): CrmCustomerProfile[] {
  if (typeof window === "undefined") {
    return inMemoryCustomers ?? buildCrmExampleRegistryState().customers;
  }

  try {
    const raw = window.localStorage.getItem(CRM_CUSTOMERS_STORAGE_KEY);
    if (!raw) {
      return inMemoryCustomers ?? buildCrmExampleRegistryState().customers;
    }

    const parsed = JSON.parse(raw) as CrmCustomerProfile[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildCrmExampleRegistryState().customers;
  } catch {
    return inMemoryCustomers ?? buildCrmExampleRegistryState().customers;
  }
}

function writeCustomersToStorage(customers: CrmCustomerProfile[]): void {
  inMemoryCustomers = customers;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CRM_CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
  } catch {
    // In-memory fallback remains active.
  }
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function matchesSegment(
  customer: CrmCustomerProfile,
  segment?: CrmListFilters["segment"],
): boolean {
  if (!segment) {
    return true;
  }

  if (Array.isArray(segment)) {
    return segment.includes(customer.segment);
  }

  return customer.segment === segment;
}

function matchesQuery(customer: CrmCustomerProfile, query?: string): boolean {
  if (!query?.trim()) {
    return true;
  }

  const normalized = query.trim().toLowerCase();

  return (
    customer.fullName.toLowerCase().includes(normalized) ||
    normalizePhone(customer.phone).includes(normalized.replace(/\D/g, "")) ||
    (customer.email?.toLowerCase().includes(normalized) ?? false)
  );
}

export function listCrmCustomers(filters: CrmListFilters = {}): CrmCustomerProfile[] {
  return readCustomersFromStorage()
    .filter((customer) => matchesSegment(customer, filters.segment))
    .filter((customer) =>
      filters.vipLevel === undefined ? true : customer.vipLevel === filters.vipLevel,
    )
    .filter((customer) => (filters.tag ? customer.tags.includes(filters.tag) : true))
    .filter((customer) => matchesQuery(customer, filters.query));
}

export function getCrmCustomerById(customerId: string): CrmCustomerProfile | null {
  return readCustomersFromStorage().find((c) => c.id === customerId) ?? null;
}

export function getCrmCustomerByPhone(phone: string): CrmCustomerProfile | null {
  const normalized = normalizePhone(phone);
  return (
    readCustomersFromStorage().find(
      (c) => normalizePhone(c.phone) === normalized,
    ) ?? null
  );
}

export function listVipCustomers(minLevel: CrmVipLevel = 2): CrmCustomerProfile[] {
  return readCustomersFromStorage().filter(
    (c) => c.vipLevel >= minLevel || c.segment === "vip_customer",
  );
}

export function listRepeatCustomers(minOrders = 2): CrmCustomerProfile[] {
  return readCustomersFromStorage().filter((c) => c.totalOrders >= minOrders);
}

export function registerCrmCustomer(customer: CrmCustomerProfile): CrmCustomerProfile {
  const customers = readCustomersFromStorage();
  const index = customers.findIndex((c) => c.id === customer.id);
  const next =
    index === -1
      ? [...customers, customer]
      : customers.map((c, i) => (i === index ? customer : c));

  writeCustomersToStorage(next);
  return customer;
}

export function seedCrmCustomerRegistry(): CrmCustomerProfile[] {
  writeCustomersToStorage(buildCrmExampleRegistryState().customers);
  return listCrmCustomers();
}

export function clearCrmCustomerRegistry(): void {
  writeCustomersToStorage([]);
}

export function getCustomerFavoriteFlowers(customerId: string): string[] {
  return getCrmCustomerById(customerId)?.favoriteFlowers ?? [];
}

export function getCustomerNotesFromProfile(customerId: string): string[] {
  return getCrmCustomerById(customerId)?.notes ?? [];
}
