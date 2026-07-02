// ==================================================
// SECTION: Admin API — Login Route
// РАЗДЕЛ: Admin API — маршрут входа
//
// Purpose (EN): POST handler — validates admin credentials via env and dev config.
//
// Назначение (RU): POST-обработчик — проверяет учётные данные admin через env и dev config.
// ==================================================
import { resolveSecurityLoginUser } from "@/components/securityIntelligence/resolveSecurityLoginUser";
import {
  adminSessionCookieHeader,
  createAdminSessionToken,
} from "@/lib/adminApiAuth";

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
      { message: "Invalid login request." },
      { status: 400 },
    );
  }

  if (typeof body.username !== "string" || typeof body.password !== "string") {
    return Response.json(
      { message: "Invalid admin credentials." },
      { status: 401 },
    );
  }

  const user = resolveSecurityLoginUser(body.username, body.password);

  if (!user) {
    return Response.json(
      { message: "Invalid admin credentials." },
      { status: 401 },
    );
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
