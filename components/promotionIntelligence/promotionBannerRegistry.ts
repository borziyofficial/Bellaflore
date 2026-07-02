// ==================================================
// SECTION: PROMOTION INTELLIGENCE
// РАЗДЕЛ: Banner registry
// ==================================================
import { buildPromotionExampleRegistryState } from "@/components/promotionIntelligence/promotionExamples";
import type {
  PromotionBanner,
  PromotionBannerPlacement,
  PromotionStatus,
} from "@/components/promotionIntelligence/promotionTypes";

export const PROMOTION_BANNER_STORAGE_KEY =
  "bellaflore_promotion_intelligence_banners_v1";

let inMemoryBanners: PromotionBanner[] | null = null;

function readBannersFromStorage(): PromotionBanner[] {
  if (typeof window === "undefined") {
    return inMemoryBanners ?? buildPromotionExampleRegistryState().banners;
  }

  try {
    const raw = window.localStorage.getItem(PROMOTION_BANNER_STORAGE_KEY);
    if (!raw) {
      return inMemoryBanners ?? buildPromotionExampleRegistryState().banners;
    }

    const parsed = JSON.parse(raw) as PromotionBanner[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildPromotionExampleRegistryState().banners;
  } catch {
    return inMemoryBanners ?? buildPromotionExampleRegistryState().banners;
  }
}

function writeBannersToStorage(banners: PromotionBanner[]): void {
  inMemoryBanners = banners;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      PROMOTION_BANNER_STORAGE_KEY,
      JSON.stringify(banners),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function isBannerWithinWindow(
  banner: PromotionBanner,
  at: Date = new Date(),
): boolean {
  const timestamp = at.getTime();
  const starts = new Date(banner.startsAt).getTime();
  const ends = banner.endsAt ? new Date(banner.endsAt).getTime() : null;

  return starts <= timestamp && (ends === null || ends >= timestamp);
}

export function listPromotionBanners(): PromotionBanner[] {
  return readBannersFromStorage();
}

export function getPromotionBannerById(bannerId: string): PromotionBanner | null {
  return readBannersFromStorage().find((banner) => banner.id === bannerId) ?? null;
}

export function listActivePromotionBanners(
  placement?: PromotionBannerPlacement,
  at: Date = new Date(),
): PromotionBanner[] {
  return readBannersFromStorage()
    .filter((banner) => banner.status === "active")
    .filter((banner) => isBannerWithinWindow(banner, at))
    .filter((banner) => (placement ? banner.placement === placement : true))
    .sort((left, right) => right.rotationWeight - left.rotationWeight);
}

export function listBannersByCampaign(campaignId: string): PromotionBanner[] {
  return readBannersFromStorage().filter((banner) => banner.campaignId === campaignId);
}

export function registerPromotionBanner(banner: PromotionBanner): PromotionBanner {
  const banners = readBannersFromStorage();
  const index = banners.findIndex((entry) => entry.id === banner.id);
  const next =
    index === -1
      ? [...banners, banner]
      : banners.map((entry, entryIndex) => (entryIndex === index ? banner : entry));

  writeBannersToStorage(next);
  return banner;
}

export function seedPromotionBannerRegistry(): PromotionBanner[] {
  writeBannersToStorage(buildPromotionExampleRegistryState().banners);
  return listPromotionBanners();
}

export function clearPromotionBannerRegistry(): void {
  writeBannersToStorage([]);
}

export function resolveBannerStatus(
  banner: PromotionBanner,
  at: Date = new Date(),
): PromotionStatus {
  const timestamp = at.getTime();
  const ends = banner.endsAt ? new Date(banner.endsAt).getTime() : null;

  if (ends !== null && ends < timestamp) {
    return "expired";
  }

  const starts = new Date(banner.startsAt).getTime();
  if (starts > timestamp) {
    return "scheduled";
  }

  return banner.status;
}

export function selectRotatedBanner(
  placement: PromotionBannerPlacement,
  at: Date = new Date(),
): PromotionBanner | null {
  const candidates = listActivePromotionBanners(placement, at);
  if (candidates.length === 0) {
    return null;
  }

  const totalWeight = candidates.reduce(
    (sum, banner) => sum + Math.max(1, banner.rotationWeight),
    0,
  );

  const slot = at.getTime() % totalWeight;
  let cursor = 0;

  for (const banner of candidates) {
    cursor += Math.max(1, banner.rotationWeight);
    if (slot < cursor) {
      return banner;
    }
  }

  return candidates[0];
}

export function buildBannerRotationPlan(
  placement: PromotionBannerPlacement,
  at: Date = new Date(),
): PromotionBanner[] {
  return listActivePromotionBanners(placement, at);
}
