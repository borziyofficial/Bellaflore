// ==================================================
// SECTION: PROMOTION INTELLIGENCE
// РАЗДЕЛ: Coupon registry
// ==================================================
import { buildPromotionExampleRegistryState } from "@/components/promotionIntelligence/promotionExamples";
import type {
  LoyaltyProgram,
  PromotionCoupon,
  PromotionCouponKind,
  PromotionStatus,
} from "@/components/promotionIntelligence/promotionTypes";

export const PROMOTION_COUPON_STORAGE_KEY =
  "bellaflore_promotion_intelligence_coupons_v1";

export const PROMOTION_LOYALTY_STORAGE_KEY =
  "bellaflore_promotion_intelligence_loyalty_v1";

let inMemoryCoupons: PromotionCoupon[] | null = null;
let inMemoryLoyalty: LoyaltyProgram | null = null;

function readCouponsFromStorage(): PromotionCoupon[] {
  if (typeof window === "undefined") {
    return inMemoryCoupons ?? buildPromotionExampleRegistryState().coupons;
  }

  try {
    const raw = window.localStorage.getItem(PROMOTION_COUPON_STORAGE_KEY);
    if (!raw) {
      return inMemoryCoupons ?? buildPromotionExampleRegistryState().coupons;
    }

    const parsed = JSON.parse(raw) as PromotionCoupon[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildPromotionExampleRegistryState().coupons;
  } catch {
    return inMemoryCoupons ?? buildPromotionExampleRegistryState().coupons;
  }
}

function writeCouponsToStorage(coupons: PromotionCoupon[]): void {
  inMemoryCoupons = coupons;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      PROMOTION_COUPON_STORAGE_KEY,
      JSON.stringify(coupons),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function readLoyaltyFromStorage(): LoyaltyProgram | null {
  if (typeof window === "undefined") {
    return inMemoryLoyalty ?? buildPromotionExampleRegistryState().loyaltyProgram;
  }

  try {
    const raw = window.localStorage.getItem(PROMOTION_LOYALTY_STORAGE_KEY);
    if (!raw) {
      return inMemoryLoyalty ?? buildPromotionExampleRegistryState().loyaltyProgram;
    }

    return JSON.parse(raw) as LoyaltyProgram;
  } catch {
    return inMemoryLoyalty ?? buildPromotionExampleRegistryState().loyaltyProgram;
  }
}

function writeLoyaltyToStorage(program: LoyaltyProgram | null): void {
  inMemoryLoyalty = program;

  if (typeof window === "undefined" || !program) {
    return;
  }

  try {
    window.localStorage.setItem(
      PROMOTION_LOYALTY_STORAGE_KEY,
      JSON.stringify(program),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function isCouponWithinWindow(
  coupon: PromotionCoupon,
  at: Date = new Date(),
): boolean {
  const timestamp = at.getTime();
  const starts = new Date(coupon.validFrom).getTime();
  const ends = coupon.validUntil ? new Date(coupon.validUntil).getTime() : null;

  return starts <= timestamp && (ends === null || ends >= timestamp);
}

export function listPromotionCoupons(): PromotionCoupon[] {
  return readCouponsFromStorage();
}

export function getPromotionCouponById(couponId: string): PromotionCoupon | null {
  return readCouponsFromStorage().find((coupon) => coupon.id === couponId) ?? null;
}

export function getPromotionCouponByCode(code: string): PromotionCoupon | null {
  const normalized = normalizeCode(code);
  return (
    readCouponsFromStorage().find(
      (coupon) => normalizeCode(coupon.code) === normalized,
    ) ?? null
  );
}

export function listActivePromotionCoupons(at: Date = new Date()): PromotionCoupon[] {
  return readCouponsFromStorage()
    .filter((coupon) => coupon.status === "active")
    .filter((coupon) => isCouponWithinWindow(coupon, at));
}

export function listCouponsByKind(kind: PromotionCouponKind): PromotionCoupon[] {
  return readCouponsFromStorage().filter((coupon) => coupon.kind === kind);
}

export function listPromoCodes(): PromotionCoupon[] {
  return listCouponsByKind("promo_code");
}

export function listGiftCards(): PromotionCoupon[] {
  return listCouponsByKind("gift_card");
}

export function listCouponsByCampaign(campaignId: string): PromotionCoupon[] {
  return readCouponsFromStorage().filter((coupon) => coupon.campaignId === campaignId);
}

export function registerPromotionCoupon(coupon: PromotionCoupon): PromotionCoupon {
  const coupons = readCouponsFromStorage();
  const index = coupons.findIndex((entry) => entry.id === coupon.id);
  const next =
    index === -1
      ? [...coupons, coupon]
      : coupons.map((entry, entryIndex) => (entryIndex === index ? coupon : entry));

  writeCouponsToStorage(next);
  return coupon;
}

export function getLoyaltyProgram(): LoyaltyProgram | null {
  return readLoyaltyFromStorage();
}

export function registerLoyaltyProgram(program: LoyaltyProgram): LoyaltyProgram {
  writeLoyaltyToStorage(program);
  return program;
}

export function seedPromotionCouponRegistry(): PromotionCoupon[] {
  const seed = buildPromotionExampleRegistryState();
  writeCouponsToStorage(seed.coupons);
  writeLoyaltyToStorage(seed.loyaltyProgram);
  return listPromotionCoupons();
}

export function clearPromotionCouponRegistry(): void {
  writeCouponsToStorage([]);
  writeLoyaltyToStorage(null);
}

export function resolveCouponStatus(
  coupon: PromotionCoupon,
  at: Date = new Date(),
): PromotionStatus {
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return "expired";
  }

  if (coupon.kind === "gift_card" && coupon.balanceRub !== null && coupon.balanceRub <= 0) {
    return "expired";
  }

  const timestamp = at.getTime();
  const ends = coupon.validUntil ? new Date(coupon.validUntil).getTime() : null;

  if (ends !== null && ends < timestamp) {
    return "expired";
  }

  const starts = new Date(coupon.validFrom).getTime();
  if (starts > timestamp) {
    return "scheduled";
  }

  return coupon.status;
}

export function isCouponUsable(
  coupon: PromotionCoupon,
  at: Date = new Date(),
): boolean {
  return resolveCouponStatus(coupon, at) === "active";
}
