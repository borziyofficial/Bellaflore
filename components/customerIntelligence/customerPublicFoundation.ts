// ==================================================
// SECTION: CUSTOMER INTELLIGENCE
// РАЗДЕЛ: Public API foundation
// ==================================================
import {
  getCustomerProfile,
  getCustomerProfileByPhone,
} from "@/components/customerIntelligence/customerProfileEngine";
import { updateCustomerPreferences } from "@/components/customerIntelligence/customerPreferenceEngine";
import type {
  CustomerFavorite,
  CustomerPreference,
  CustomerPublicSummary,
} from "@/components/customerIntelligence/customerIntelligenceTypes";

export function getCustomerPublicSummary(
  customerIdOrPhone: string,
): CustomerPublicSummary | null {
  const profile =
    getCustomerProfile(customerIdOrPhone) ??
    getCustomerProfileByPhone(customerIdOrPhone);

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    fullName: profile.fullName,
    favoriteCount: profile.favorites.length,
    segment: profile.segment,
    vipLevel: profile.vipLevel,
    preferredDeliveryTimes: profile.preferences.preferredDeliveryTimes,
    favoriteCategories: profile.preferences.favoriteCategories,
  };
}

export function updateCustomerPublicPreferences(
  customerId: string,
  patch: Partial<Omit<CustomerPreference, "updatedAt">>,
) {
  return updateCustomerPreferences(customerId, patch);
}

export function listCustomerPublicFavorites(
  customerId: string,
): CustomerFavorite[] {
  return getCustomerProfile(customerId)?.favorites ?? [];
}

export const CUSTOMER_PUBLIC_API_FOUNDATION = {
  routes: [
    {
      id: "getCustomerPublicSummary",
      method: "GET",
      path: "/api/customers/:id/summary",
      status: "foundation_only" as const,
    },
    {
      id: "updateCustomerPublicPreferences",
      method: "PATCH",
      path: "/api/customers/:id/preferences",
      status: "foundation_only" as const,
    },
    {
      id: "listCustomerPublicFavorites",
      method: "GET",
      path: "/api/customers/:id/favorites",
      status: "foundation_only" as const,
    },
  ],
} as const;
