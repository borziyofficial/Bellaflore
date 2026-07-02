// ==================================================
// SECTION: CUSTOMER INTELLIGENCE
// РАЗДЕЛ: Occasion engine
// ==================================================
import {
  getCustomerProfile,
  saveCustomerProfileState,
} from "@/components/customerIntelligence/customerProfileEngine";
import type {
  CustomerOccasion,
  CustomerProfile,
} from "@/components/customerIntelligence/customerIntelligenceTypes";

function generateOccasionId(): string {
  return `occasion-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function addCustomerOccasion(
  customerId: string,
  occasion: Omit<CustomerOccasion, "id" | "createdAt">,
): CustomerProfile | null {
  const profile = getCustomerProfile(customerId);
  if (!profile) {
    return null;
  }

  const entry: CustomerOccasion = {
    ...occasion,
    id: generateOccasionId(),
    createdAt: new Date().toISOString(),
  };

  return saveCustomerProfileState({
    ...profile,
    occasions: [...profile.occasions, entry],
  });
}

export function listCustomerOccasions(customerId: string): CustomerOccasion[] {
  return getCustomerProfile(customerId)?.occasions ?? [];
}

export const CUSTOMER_OCCASION_KINDS: CustomerOccasion["kind"][] = [
  "birthday",
  "anniversary",
  "wedding",
  "holiday",
  "custom",
];
