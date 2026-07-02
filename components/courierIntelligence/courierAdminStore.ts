// ==================================================
// SECTION: COURIER INTELLIGENCE
// РАЗДЕЛ: Admin overrides store
// ==================================================
import { getCourierCatalogSeed } from "@/components/courierIntelligence/courierCatalog";
import type {
  CourierAdminOverride,
  CourierProfile,
} from "@/components/courierIntelligence/courierIntelligenceTypes";

export const COURIER_INTELLIGENCE_ADMIN_STORAGE_KEY =
  "bellaflore_courier_intelligence_admin_v1";

export const DEFAULT_COURIER_ADMIN_OVERRIDE: CourierAdminOverride = {
  blockedCourierIds: [],
  profileOverrides: {},
  rulesVersion: "bellaflore_courier_intelligence_admin_v1",
  updatedAt: new Date().toISOString(),
};

export function readCourierAdminOverride(): CourierAdminOverride {
  if (typeof window === "undefined") {
    return DEFAULT_COURIER_ADMIN_OVERRIDE;
  }

  try {
    const raw = window.localStorage.getItem(COURIER_INTELLIGENCE_ADMIN_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_COURIER_ADMIN_OVERRIDE;
    }

    const parsed = JSON.parse(raw) as Partial<CourierAdminOverride>;
    return {
      ...DEFAULT_COURIER_ADMIN_OVERRIDE,
      ...parsed,
      blockedCourierIds: parsed.blockedCourierIds ?? [],
      profileOverrides: parsed.profileOverrides ?? {},
    };
  } catch {
    return DEFAULT_COURIER_ADMIN_OVERRIDE;
  }
}

export function writeCourierAdminOverride(override: CourierAdminOverride): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      COURIER_INTELLIGENCE_ADMIN_STORAGE_KEY,
      JSON.stringify(override),
    );
  } catch {
    // Optional admin storage.
  }
}

export function mergeCourierProfilesWithAdmin(
  adminOverride: CourierAdminOverride = readCourierAdminOverride(),
): CourierProfile[] {
  const blocked = new Set(adminOverride.blockedCourierIds);

  return getCourierCatalogSeed().map((seed) => {
    const override = adminOverride.profileOverrides[seed.id] ?? {};

    return {
      ...seed,
      ...override,
      id: seed.id,
      fullName: seed.fullName,
      phone: seed.phone,
      isBlocked: blocked.has(seed.id) || Boolean(override.isBlocked),
      activeOrderIds: seed.activeOrderIds,
      supportedZoneIds: override.supportedZoneIds ?? seed.supportedZoneIds,
      workingHours: override.workingHours ?? seed.workingHours,
      currentLocation:
        override.currentLocation === undefined
          ? seed.currentLocation
          : override.currentLocation,
    };
  });
}

export function blockCourierInAdmin(courierId: string): CourierAdminOverride {
  const current = readCourierAdminOverride();
  const next: CourierAdminOverride = {
    ...current,
    blockedCourierIds: [...new Set([...current.blockedCourierIds, courierId])],
    updatedAt: new Date().toISOString(),
  };

  writeCourierAdminOverride(next);
  return next;
}

export function unblockCourierInAdmin(courierId: string): CourierAdminOverride {
  const current = readCourierAdminOverride();
  const next: CourierAdminOverride = {
    ...current,
    blockedCourierIds: current.blockedCourierIds.filter((id) => id !== courierId),
    updatedAt: new Date().toISOString(),
  };

  writeCourierAdminOverride(next);
  return next;
}
