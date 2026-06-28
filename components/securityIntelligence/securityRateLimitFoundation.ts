// ==================================================
// SECTION: SECURITY INTELLIGENCE
// РАЗДЕЛ: Rate limit foundation (in-memory)
// ==================================================
import type {
  SecurityRateLimitBucket,
  SecurityRateLimitCheck,
} from "@/components/securityIntelligence/securityIntelligenceTypes";

type RateLimitState = {
  count: number;
  windowStartedAt: number;
};

const BUCKET_LIMITS: Record<SecurityRateLimitBucket, { limit: number; windowMs: number }> = {
  login_attempt: { limit: 5, windowMs: 15 * 60 * 1000 },
  admin_action: { limit: 120, windowMs: 60 * 1000 },
  notification_retry: { limit: 20, windowMs: 60 * 1000 },
  api_request: { limit: 300, windowMs: 60 * 1000 },
};

const bucketStore = new Map<string, RateLimitState>();

function bucketKey(bucket: SecurityRateLimitBucket, identifier: string): string {
  return `${bucket}:${identifier}`;
}

function getBucketState(
  bucket: SecurityRateLimitBucket,
  identifier: string,
): RateLimitState {
  const key = bucketKey(bucket, identifier);
  const config = BUCKET_LIMITS[bucket];
  const existing = bucketStore.get(key);
  const now = Date.now();

  if (!existing || now - existing.windowStartedAt >= config.windowMs) {
    const fresh = { count: 0, windowStartedAt: now };
    bucketStore.set(key, fresh);
    return fresh;
  }

  return existing;
}

export function checkRateLimit(
  bucket: SecurityRateLimitBucket,
  identifier = "global",
): SecurityRateLimitCheck {
  const config = BUCKET_LIMITS[bucket];
  const state = getBucketState(bucket, identifier);
  const remaining = Math.max(0, config.limit - state.count);
  const resetAt = new Date(state.windowStartedAt + config.windowMs).toISOString();

  return {
    bucket,
    allowed: state.count < config.limit,
    remaining,
    limit: config.limit,
    resetAt,
  };
}

export function recordRateLimitHit(
  bucket: SecurityRateLimitBucket,
  identifier = "global",
): SecurityRateLimitCheck {
  const state = getBucketState(bucket, identifier);
  state.count += 1;
  bucketStore.set(bucketKey(bucket, identifier), state);
  return checkRateLimit(bucket, identifier);
}

export function resetRateLimitBucket(
  bucket: SecurityRateLimitBucket,
  identifier = "global",
): void {
  bucketStore.delete(bucketKey(bucket, identifier));
}

export function getRateLimitConfig(bucket: SecurityRateLimitBucket) {
  return BUCKET_LIMITS[bucket];
}
