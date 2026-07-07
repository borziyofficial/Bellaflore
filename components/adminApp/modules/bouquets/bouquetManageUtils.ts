// ==================================================
// SECTION: ADMIN APP — Bouquet management helpers (Stage 2.4)
// ==================================================
import { getEnabledBouquetSizeCodes } from "@/components/adminApp/modules/bouquets/bouquetSizeUtils";
import type {
  BouquetBadge,
  BouquetDisplayFlags,
  BouquetDraft,
  BouquetStatus,
} from "@/components/adminApp/modules/bouquets/bouquetTypes";
import {
  BOUQUET_BADGE_VALUES,
  BOUQUET_STATUS_VALUES,
} from "@/components/adminApp/modules/bouquets/bouquetTypes";

export function createDefaultBouquetDisplayFlags(): BouquetDisplayFlags {
  return {
    showOnHomepage: false,
    showInCatalog: true,
    isNew: false,
    isBestseller: false,
    isRecommended: false,
    isPremium: false,
    isSeasonal: false,
  };
}

export function normalizeBouquetStatus(value: unknown): BouquetStatus {
  if (typeof value === "string" && (BOUQUET_STATUS_VALUES as readonly string[]).includes(value)) {
    return value as BouquetStatus;
  }

  return "active";
}

export function normalizeBouquetBadge(value: unknown): BouquetBadge {
  if (typeof value === "string" && (BOUQUET_BADGE_VALUES as readonly string[]).includes(value)) {
    return value as BouquetBadge;
  }

  return "none";
}

export function normalizeBouquetDisplayFlags(value: unknown): BouquetDisplayFlags {
  const defaults = createDefaultBouquetDisplayFlags();

  if (!value || typeof value !== "object") {
    return defaults;
  }

  const flags = value as Partial<BouquetDisplayFlags>;
  return {
    showOnHomepage: Boolean(flags.showOnHomepage),
    showInCatalog: flags.showInCatalog === undefined ? true : Boolean(flags.showInCatalog),
    isNew: Boolean(flags.isNew),
    isBestseller: Boolean(flags.isBestseller),
    isRecommended: Boolean(flags.isRecommended),
    isPremium: Boolean(flags.isPremium),
    isSeasonal: Boolean(flags.isSeasonal),
  };
}

export function normalizeBouquetDisplayPriority(value: unknown): number {
  const parsed = Math.max(1, Math.round(Number(value) || 100));
  return parsed;
}

export function cloneBouquetDisplayFlags(flags: BouquetDisplayFlags): BouquetDisplayFlags {
  return { ...flags };
}

export function resolveBouquetPreviewPrice(draft: BouquetDraft): number {
  const enabledCodes = getEnabledBouquetSizeCodes(draft.sizes);
  const sizePrices = enabledCodes
    .map((code) => draft.sizes[code].price)
    .filter((price) => price > 0);

  if (sizePrices.length > 0) {
    return Math.min(...sizePrices);
  }

  return Math.max(0, Number(draft.basePrice) || 0);
}

export function resolveBouquetPreviewPriceLabel(draft: BouquetDraft): string {
  const enabledCodes = getEnabledBouquetSizeCodes(draft.sizes);
  const sizePrices = enabledCodes
    .map((code) => draft.sizes[code].price)
    .filter((price) => price > 0);

  if (sizePrices.length === 0) {
    return "";
  }

  const min = Math.min(...sizePrices);
  const max = Math.max(...sizePrices);
  if (min === max) {
    return "";
  }

  return `${min}–${max}`;
}
