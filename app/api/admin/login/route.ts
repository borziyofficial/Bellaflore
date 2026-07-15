// ==================================================
// SECTION: Admin API — Login Route
// РАЗДЕЛ: Admin API — маршрут входа
//
// Purpose (EN): POST handler — validates admin credentials via env and dev config.
//
// Назначение (RU): POST-обработчик — проверяет учётные данные admin через env и dev config.
// ==================================================
import { resolveSecurityLoginUser } from "@/components/securityIntelligence/resolveSecurityLoginUser";
import { PRODUCTION_ADMIN_USER_ID_PREFIX } from "@/components/securityIntelligence/securityProductionConstants";
import {
  adminSessionCookieHeader,
  createAdminSessionToken,
} from "@/lib/adminApiAuth";
import { getAdminProfile, verifyStoredPassword } from "@/lib/adminProfileDb";

export const dynamic = "force-dynamic";

type AdminLoginRequest = {
  username?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  let body: AdminLoginRequest;

  try {
    body = (await request.json()) as AdminLoginRequest;
  } catch {
    return Response.json(
      { message: "Некорректный запрос на вход." },
      { status: 400 },
    );
  }

  if (typeof body.username !== "string" || typeof body.password !== "string") {
    return Response.json(
      { message: "Неверные учётные данные администратора." },
      { status: 401 },
    );
  }

  const normalizedUsername = body.username.trim();
  const normalizedPassword = body.password.trim();

  const profile = await getAdminProfile().catch(() => null);
  const adminUsername = process.env.ADMIN_USERNAME?.trim();

  let user = null as ReturnType<typeof resolveSecurityLoginUser>;

  // If the admin has set a custom password via the Profile section, honor it
  // first — it takes precedence over the env-configured password for the
  // same account. Falls back to the original env-based check otherwise, so
  // nothing breaks for accounts that never changed their password.
  if (
    adminUsername &&
    profile?.passwordHash &&
    normalizedUsername === adminUsername &&
    verifyStoredPassword(normalizedPassword, profile.passwordHash)
  ) {
    const normalizedId = adminUsername.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const now = new Date().toISOString();
    user = {
      id: `${PRODUCTION_ADMIN_USER_ID_PREFIX}-${normalizedId || "user"}`,
      name: profile.displayName || adminUsername,
      email: profile.email || `${adminUsername}@bellaflore.ru`,
      role: "owner",
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };
  }

  if (!user) {
    user = resolveSecurityLoginUser(body.username, body.password);
  }

  if (!user) {
    return Response.json(
      { message: "Неверные учётные данные администратора." },
      { status: 401 },
    );
  }

  // Apply display-name/email overrides from the Profile section even when
  // the env password path matched (password unchanged, but name/email set).
  if (profile && (profile.displayName || profile.email)) {
    user = {
      ...user,
      name: profile.displayName || user.name,
      email: profile.email || user.email,
    };
  }

  const token = createAdminSessionToken(user.id);

  return Response.json(
    {
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
    {
      headers: {
        "Set-Cookie": adminSessionCookieHeader(token),
      },
    },
  );
}
