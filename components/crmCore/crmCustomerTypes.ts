// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Type definitions for crmCore.
//
// Назначение (RU): Определения типов для crmCore.
// ==================================================
export type CrmCustomerAddress = {
  address: string;
  deliveryZone: string | null;
  lastUsedAt: string;
};

export type CrmCustomer = {
  customerId: string;
  name: string;
  phone: string;
  email: string | null;
  addresses: CrmCustomerAddress[];
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
  firstOrderAt: string | null;
  tags: string[];
  notes: string[];
  blacklistStatus: boolean;
  vipStatus: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateOrUpdateCrmCustomerInput = {
  name: string;
  phone: string;
  email?: string | null;
  deliveryAddress: string;
  deliveryZone?: string | null;
  orderTotal: number;
  orderAt: string;
};
