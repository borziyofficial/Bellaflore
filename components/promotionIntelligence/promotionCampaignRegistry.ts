// ==================================================
// SECTION: PROMOTION INTELLIGENCE
// РАЗДЕЛ: Campaign registry
// ==================================================
import { buildPromotionExampleRegistryState } from "@/components/promotionIntelligence/promotionExamples";
import type {
  MarketingCampaign,
  PromotionKind,
  PromotionListFilters,
  PromotionStatus,
} from "@/components/promotionIntelligence/promotionTypes";

export const PROMOTION_CAMPAIGN_STORAGE_KEY =
  "bellaflore_promotion_intelligence_campaigns_v1";

let inMemoryCampaigns: MarketingCampaign[] | null = null;

function readCampaignsFromStorage(): MarketingCampaign[] {
  if (typeof window === "undefined") {
    return inMemoryCampaigns ?? buildPromotionExampleRegistryState().campaigns;
  }

  try {
    const raw = window.localStorage.getItem(PROMOTION_CAMPAIGN_STORAGE_KEY);
    if (!raw) {
      return inMemoryCampaigns ?? buildPromotionExampleRegistryState().campaigns;
    }

    const parsed = JSON.parse(raw) as MarketingCampaign[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildPromotionExampleRegistryState().campaigns;
  } catch {
    return inMemoryCampaigns ?? buildPromotionExampleRegistryState().campaigns;
  }
}

function writeCampaignsToStorage(campaigns: MarketingCampaign[]): void {
  inMemoryCampaigns = campaigns;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      PROMOTION_CAMPAIGN_STORAGE_KEY,
      JSON.stringify(campaigns),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function matchesKind(
  campaign: MarketingCampaign,
  kind?: PromotionListFilters["kind"],
): boolean {
  if (!kind) {
    return true;
  }

  if (Array.isArray(kind)) {
    return kind.includes(campaign.kind);
  }

  return campaign.kind === kind;
}

function matchesStatus(
  campaign: MarketingCampaign,
  status?: PromotionListFilters["status"],
): boolean {
  if (!status) {
    return true;
  }

  if (Array.isArray(status)) {
    return status.includes(campaign.status);
  }

  return campaign.status === status;
}

function matchesQuery(campaign: MarketingCampaign, query?: string): boolean {
  if (!query?.trim()) {
    return true;
  }

  const normalized = query.trim().toLowerCase();

  return (
    campaign.title.toLowerCase().includes(normalized) ||
    campaign.slug.toLowerCase().includes(normalized) ||
    campaign.tags.some((tag) => tag.toLowerCase().includes(normalized))
  );
}

export function listMarketingCampaigns(
  filters: PromotionListFilters = {},
): MarketingCampaign[] {
  return readCampaignsFromStorage()
    .filter((campaign) => matchesKind(campaign, filters.kind))
    .filter((campaign) => matchesStatus(campaign, filters.status))
    .filter((campaign) => matchesQuery(campaign, filters.query))
    .sort((left, right) => right.priority - left.priority);
}

export function getMarketingCampaignById(
  campaignId: string,
): MarketingCampaign | null {
  return readCampaignsFromStorage().find((campaign) => campaign.id === campaignId) ?? null;
}

export function getMarketingCampaignBySlug(
  slug: string,
): MarketingCampaign | null {
  return readCampaignsFromStorage().find((campaign) => campaign.slug === slug) ?? null;
}

export function listActiveMarketingCampaigns(
  at: Date = new Date(),
): MarketingCampaign[] {
  const timestamp = at.getTime();

  return listMarketingCampaigns({ status: "active" }).filter((campaign) => {
    const starts = new Date(campaign.startsAt).getTime();
    const ends = campaign.endsAt ? new Date(campaign.endsAt).getTime() : null;

    return starts <= timestamp && (ends === null || ends >= timestamp);
  });
}

export function listCampaignsByKind(kind: PromotionKind): MarketingCampaign[] {
  return listMarketingCampaigns({ kind });
}

export function registerMarketingCampaign(campaign: MarketingCampaign): MarketingCampaign {
  const campaigns = readCampaignsFromStorage();
  const index = campaigns.findIndex((entry) => entry.id === campaign.id);
  const next =
    index === -1
      ? [...campaigns, campaign]
      : campaigns.map((entry, entryIndex) => (entryIndex === index ? campaign : entry));

  writeCampaignsToStorage(next);
  return campaign;
}

export function seedMarketingCampaignRegistry(): MarketingCampaign[] {
  writeCampaignsToStorage(buildPromotionExampleRegistryState().campaigns);
  return listMarketingCampaigns();
}

export function clearMarketingCampaignRegistry(): void {
  writeCampaignsToStorage([]);
}

export function isCampaignActive(
  campaign: MarketingCampaign,
  at: Date = new Date(),
): boolean {
  if (campaign.status !== "active" && campaign.status !== "scheduled") {
    return false;
  }

  const timestamp = at.getTime();
  const starts = new Date(campaign.startsAt).getTime();
  const ends = campaign.endsAt ? new Date(campaign.endsAt).getTime() : null;

  return starts <= timestamp && (ends === null || ends >= timestamp);
}

export function resolveCampaignStatus(
  campaign: MarketingCampaign,
  at: Date = new Date(),
): PromotionStatus {
  const timestamp = at.getTime();
  const ends = campaign.endsAt ? new Date(campaign.endsAt).getTime() : null;

  if (ends !== null && ends < timestamp) {
    return "expired";
  }

  const starts = new Date(campaign.startsAt).getTime();
  if (starts > timestamp) {
    return "scheduled";
  }

  return campaign.status;
}
