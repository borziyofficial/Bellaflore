const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILURES = 8;

type AttemptState = {
  failures: number;
  firstFailureAt: number;
  blockedUntil: number;
};

const attempts = new Map<string, AttemptState>();

function cleanup(now: number): void {
  for (const [key, state] of attempts) {
    if (state.blockedUntil <= now && now - state.firstFailureAt > WINDOW_MS) {
      attempts.delete(key);
    }
  }
}

export function getClientKey(request: Request, username: string): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const ip = forwardedFor || realIp || "unknown";
  return `${ip}:${username.trim().toLowerCase()}`;
}

export function isAdminLoginRateLimited(key: string, now = Date.now()): boolean {
  cleanup(now);
  const state = attempts.get(key);
  return Boolean(state && state.blockedUntil > now);
}

export function recordAdminLoginFailure(key: string, now = Date.now()): void {
  cleanup(now);

  const current = attempts.get(key);
  if (!current || now - current.firstFailureAt >= WINDOW_MS) {
    attempts.set(key, {
      failures: 1,
      firstFailureAt: now,
      blockedUntil: 0,
    });
    return;
  }

  const failures = current.failures + 1;
  attempts.set(key, {
    failures,
    firstFailureAt: current.firstFailureAt,
    blockedUntil: failures >= MAX_FAILURES ? now + WINDOW_MS : 0,
  });
}

export function clearAdminLoginFailures(key: string): void {
  attempts.delete(key);
}

export const ADMIN_LOGIN_RATE_LIMIT_MESSAGE =
  "Слишком много неудачных попыток входа. Повторите через несколько минут.";
