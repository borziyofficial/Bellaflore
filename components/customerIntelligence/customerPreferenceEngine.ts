// ==================================================
// SECTION: CUSTOMER INTELLIGENCE
// РАЗДЕЛ: Preference engine
// ==================================================
import {
  getCustomerProfile,
  saveCustomerProfileState,
} from "@/components/customerIntelligence/customerProfileEngine";
import type {
  CustomerPreference,
  CustomerProfile,
} from "@/components/customerIntelligence/customerIntelligenceTypes";

export function updateCustomerPreferences(
  customerId: string,
  patch: Partial<Omit<CustomerPreference, "updatedAt">>,
): CustomerProfile | null {
  const profile = getCustomerProfile(customerId);
  if (!profile) {
    return null;
  }

  const preferences: CustomerPreference = {
    ...profile.preferences,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  return saveCustomerProfileState({ ...profile, preferences });
}

export function mergeCustomerPreferences(
  profile: CustomerProfile,
  patch: Partial<Omit<CustomerPreference, "updatedAt">>,
): CustomerPreference {
  return {
    ...profile.preferences,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

export const CUSTOMER_PREFERENCE_FIELDS: Array<keyof Omit<CustomerPreference, "updatedAt">> = [
  "favoriteFlowers",
  "favoriteColors",
  "favoriteBouquetStyles",
  "favoriteCategories",
  "preferredDeliveryZones",
  "preferredDeliveryTimes",
  "preferredAddOns",
  "dislikedFlowers",
  "dislikedColors",
];
