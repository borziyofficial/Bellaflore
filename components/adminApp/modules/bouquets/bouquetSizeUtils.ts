// ==================================================
// SECTION: ADMIN APP — Bouquet size helpers (Stage 2.3)
// ==================================================
import type {
  BouquetSizeCode,
  BouquetSizeEntry,
  BouquetSizes,
  BouquetSizesPlaceholder,
} from "@/components/adminApp/modules/bouquets/bouquetTypes";
import { BOUQUET_SIZE_CODES } from "@/components/adminApp/modules/bouquets/bouquetTypes";

export function createEmptyBouquetSizes(): BouquetSizes {
  return {
    S: { enabled: false, price: 0 },
    M: { enabled: false, price: 0 },
    L: { enabled: false, price: 0 },
    XL: { enabled: false, price: 0 },
  };
}

function normalizeSizeEntry(value: unknown): BouquetSizeEntry {
  if (!value || typeof value !== "object") {
    return { enabled: false, price: 0 };
  }

  const entry = value as Partial<BouquetSizeEntry>;
  return {
    enabled: Boolean(entry.enabled),
    price: Math.max(0, Number(entry.price) || 0),
  };
}

export function normalizeBouquetSizes(value: unknown): BouquetSizes {
  const empty = createEmptyBouquetSizes();

  if (!value || typeof value !== "object") {
    return empty;
  }

  const legacy = value as BouquetSizesPlaceholder;
  if (Array.isArray(legacy.items)) {
    for (const item of legacy.items) {
      if (item?.code && BOUQUET_SIZE_CODES.includes(item.code)) {
        empty[item.code] = {
          enabled: true,
          price: Math.max(0, Number(item.price) || 0),
        };
      }
    }
    return empty;
  }

  for (const code of BOUQUET_SIZE_CODES) {
    empty[code] = normalizeSizeEntry((value as BouquetSizes)[code]);
  }

  return empty;
}

export function toggleBouquetSize(
  sizes: BouquetSizes,
  code: BouquetSizeCode,
): BouquetSizes {
  return {
    ...sizes,
    [code]: {
      ...sizes[code],
      enabled: !sizes[code].enabled,
    },
  };
}

export function setBouquetSizePrice(
  sizes: BouquetSizes,
  code: BouquetSizeCode,
  price: number,
): BouquetSizes {
  return {
    ...sizes,
    [code]: {
      ...sizes[code],
      price: Math.max(0, Number(price) || 0),
    },
  };
}

export function cloneBouquetSizes(sizes: BouquetSizes): BouquetSizes {
  return BOUQUET_SIZE_CODES.reduce((acc, code) => {
    acc[code] = { ...sizes[code] };
    return acc;
  }, createEmptyBouquetSizes());
}

export function getEnabledBouquetSizeCodes(sizes: BouquetSizes): BouquetSizeCode[] {
  return BOUQUET_SIZE_CODES.filter((code) => sizes[code].enabled);
}
