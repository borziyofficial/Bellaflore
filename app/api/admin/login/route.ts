// ==================================================
// SECTION: Admin API — Login Route
// РАЗДЕЛ: Admin API — маршрут входа
//
// Purpose (EN): POST handler — validates admin credentials via env and security dev config.
//
// Назначение (RU): POST-обработчик — проверяет учётные данные admin через env и security dev config.
// ==================================================
import { findDevSecurityUserByCredentials } from "@/components/securityIntelligence/securityDevConfig";

type AdminLoginRequest = {
  username?: unknown;
  password?: unknown;
};

function isExpectedCredential(value: unknown, expected: string): boolean {
  return typeof value === "string" && value === expected;
}

function credentialsMatchEnv(username: unknown, password: unknown): boolean {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    return false;
  }

  return (
    isExpectedCredential(username, adminUsername) &&
    isExpectedCredential(password, adminPassword)
  );
}

function credentialsMatchDevConfig(username: unknown, password: unknown): boolean {
  if (typeof username !== "string" || typeof password !== "string") {
    return false;
  }

  return findDevSecurityUserByCredentials(username, password) !== null;
}

export async function POST(request: Request) {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    return Response.json(
      { message: "Admin credentials are not configured." },
      { status: 500 },
    );
  }

  let body: AdminLoginRequest;

  try {
    body = (await request.json()) as AdminLoginRequest;
  } catch {
    return Response.json(
      { message: "Invalid login request." },
      { status: 400 },
    );
  }

  const isValid =
    credentialsMatchEnv(body.username, body.password) ||
    credentialsMatchDevConfig(body.username, body.password);

  if (!isValid) {
    return Response.json(
      { message: "Invalid admin credentials." },
      { status: 401 },
    );
  }

  return Response.json({ authenticated: true });
}
