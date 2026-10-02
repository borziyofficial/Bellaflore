const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 30;

type LookupState = {
  requests: number;
  windowStartedAt: number;
};

const requestsByClient = new Map<string, LookupState>();

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return forwardedFor || realIp || "unknown";
}

function cleanup(now: number): void {
  for (const [key, state] of requestsByClient) {
    if (now - state.windowStartedAt >= WINDOW_MS) {
      requestsByClient.delete(key);
    }
  }
}

export function consumeOrderLookupRateLimit(
  request: Request,
  now = Date.now(),
): { allowed: boolean; retryAfterSeconds: number } {
  cleanup(now);

  const key = getClientIp(request);
  const current = requestsByClient.get(key);

  if (!current || now - current.windowStartedAt >= WINDOW_MS) {
    requestsByClient.set(key, { requests: 1, windowStartedAt: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.requests >= MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((WINDOW_MS - (now - current.windowStartedAt)) / 1000),
    );
    return { allowed: false, retryAfterSeconds };
  }

  current.requests += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
