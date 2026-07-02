// ==================================================
// SECTION: CUSTOMER INTELLIGENCE
// РАЗДЕЛ: Profile engine
// ==================================================
import {
  buildEmptyCustomerProfile,
  CUSTOMER_INTELLIGENCE_SEED,
} from "@/components/customerIntelligence/customerCatalogSeed";
import type {
  CustomerAddress,
  CustomerCommunicationHistory,
  CustomerFavorite,
  CustomerProfile,
  CustomerProfileInput,
  CustomerRecipient,
} from "@/components/customerIntelligence/customerIntelligenceTypes";

export const CUSTOMER_INTELLIGENCE_STORAGE_KEY =
  "bellaflore_customer_intelligence_v1";

let inMemoryProfiles: CustomerProfile[] | null = null;

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function generateCustomerId(phone: string): string {
  return `customer-${normalizePhone(phone) || Date.now()}`;
}

function generateEntityId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function readProfilesFromStorage(): CustomerProfile[] {
  if (typeof window === "undefined") {
    return inMemoryProfiles ?? [...CUSTOMER_INTELLIGENCE_SEED];
  }

  try {
    const raw = window.localStorage.getItem(CUSTOMER_INTELLIGENCE_STORAGE_KEY);
    if (!raw) {
      return inMemoryProfiles ?? [...CUSTOMER_INTELLIGENCE_SEED];
    }

    const parsed = JSON.parse(raw) as CustomerProfile[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : [...CUSTOMER_INTELLIGENCE_SEED];
  } catch {
    return inMemoryProfiles ?? [...CUSTOMER_INTELLIGENCE_SEED];
  }
}

function writeProfilesToStorage(profiles: CustomerProfile[]): void {
  inMemoryProfiles = profiles;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CUSTOMER_INTELLIGENCE_STORAGE_KEY,
      JSON.stringify(profiles),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function saveProfile(profile: CustomerProfile): CustomerProfile {
  const profiles = readProfilesFromStorage();
  const index = profiles.findIndex((entry) => entry.id === profile.id);
  const nextProfiles =
    index === -1
      ? [...profiles, profile]
      : profiles.map((entry, entryIndex) => (entryIndex === index ? profile : entry));

  writeProfilesToStorage(nextProfiles);
  return profile;
}

export function listCustomerProfiles(): CustomerProfile[] {
  return readProfilesFromStorage();
}

export function getCustomerProfile(customerId: string): CustomerProfile | null {
  return listCustomerProfiles().find((profile) => profile.id === customerId) ?? null;
}

export function getCustomerProfileByPhone(phone: string): CustomerProfile | null {
  const normalized = normalizePhone(phone);
  return (
    listCustomerProfiles().find(
      (profile) => normalizePhone(profile.phone) === normalized,
    ) ?? null
  );
}

export function createCustomerProfile(input: CustomerProfileInput): CustomerProfile {
  const existing = getCustomerProfileByPhone(input.phone);
  if (existing) {
    return existing;
  }

  const profile = buildEmptyCustomerProfile({
    id: generateCustomerId(input.phone),
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email ?? null,
  });

  if (input.notes?.length) {
    profile.notes = [...input.notes];
  }

  if (input.tags?.length) {
    profile.tags = [...input.tags];
  }

  return saveProfile(profile);
}

export function updateCustomerProfile(
  customerId: string,
  patch: Partial<
    Pick<
      CustomerProfile,
      "fullName" | "email" | "notes" | "tags" | "vipLevel" | "segment"
    >
  >,
): CustomerProfile | null {
  const profile = getCustomerProfile(customerId);
  if (!profile) {
    return null;
  }

  const updated: CustomerProfile = {
    ...profile,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  return saveProfile(updated);
}

export function addCustomerAddress(
  customerId: string,
  address: Omit<CustomerAddress, "id" | "createdAt">,
): CustomerProfile | null {
  const profile = getCustomerProfile(customerId);
  if (!profile) {
    return null;
  }

  const entry: CustomerAddress = {
    ...address,
    id: generateEntityId("address"),
    createdAt: new Date().toISOString(),
  };

  const addresses = address.isDefault
    ? profile.addresses.map((item) => ({ ...item, isDefault: false }))
    : profile.addresses;

  return saveProfile({
    ...profile,
    addresses: [...addresses, entry],
    updatedAt: new Date().toISOString(),
  });
}

export function addCustomerRecipient(
  customerId: string,
  recipient: Omit<CustomerRecipient, "id" | "createdAt">,
): CustomerProfile | null {
  const profile = getCustomerProfile(customerId);
  if (!profile) {
    return null;
  }

  const entry: CustomerRecipient = {
    ...recipient,
    id: generateEntityId("recipient"),
    createdAt: new Date().toISOString(),
  };

  return saveProfile({
    ...profile,
    recipients: [...profile.recipients, entry],
    updatedAt: new Date().toISOString(),
  });
}

export function addCustomerFavorite(
  customerId: string,
  favorite: Omit<CustomerFavorite, "id" | "addedAt">,
): CustomerProfile | null {
  const profile = getCustomerProfile(customerId);
  if (!profile) {
    return null;
  }

  if (profile.favorites.some((item) => item.productId === favorite.productId)) {
    return profile;
  }

  const entry: CustomerFavorite = {
    ...favorite,
    id: generateEntityId("favorite"),
    addedAt: new Date().toISOString(),
  };

  return saveProfile({
    ...profile,
    favorites: [...profile.favorites, entry],
    updatedAt: new Date().toISOString(),
  });
}

export function addCustomerCommunication(
  customerId: string,
  communication: Omit<CustomerCommunicationHistory, "id" | "createdAt">,
): CustomerProfile | null {
  const profile = getCustomerProfile(customerId);
  if (!profile) {
    return null;
  }

  const entry: CustomerCommunicationHistory = {
    ...communication,
    id: generateEntityId("communication"),
    createdAt: new Date().toISOString(),
  };

  return saveProfile({
    ...profile,
    communicationHistory: [entry, ...profile.communicationHistory],
    updatedAt: new Date().toISOString(),
  });
}

export function saveCustomerProfileState(profile: CustomerProfile): CustomerProfile {
  return saveProfile({ ...profile, updatedAt: new Date().toISOString() });
}

export function clearCustomerIntelligenceStore(): void {
  writeProfilesToStorage([]);
}

export function seedCustomerIntelligenceStore(): CustomerProfile[] {
  writeProfilesToStorage([...CUSTOMER_INTELLIGENCE_SEED]);
  return listCustomerProfiles();
}
