import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "bellaflore_admin_session";

function getAdminSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    "bellaflore-dev-admin-secret"
  );
}

export function createAdminSessionToken(userId: string): string {
  const payload = JSON.stringify({
    userId,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  });
  const signature = createHmac("sha256", getAdminSessionSecret())
    .update(payload)
    .digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

export function verifyAdminSessionToken(token: string): boolean {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return false;
  }

  let payload = "";
  try {
    payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  } catch {
    return false;
  }

  const expectedSignature = createHmac("sha256", getAdminSessionSecret())
    .update(payload)
    .digest("hex");

  try {
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }
    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return false;
    }
  } catch {
    return false;
  }

  try {
    const parsed = JSON.parse(payload) as { exp?: number };
    return typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

export function getAdminSessionTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((part) => part.trim());
  const sessionCookie = cookies.find((part) =>
    part.startsWith(`${ADMIN_SESSION_COOKIE}=`),
  );
  if (!sessionCookie) {
    return null;
  }

  return decodeURIComponent(sessionCookie.slice(ADMIN_SESSION_COOKIE.length + 1));
}

export function isAdminRequestAuthorized(request: Request): boolean {
  const token = getAdminSessionTokenFromRequest(request);
  return token ? verifyAdminSessionToken(token) : false;
}

export function unauthorizedAdminResponse(): Response {
  return Response.json({ message: "Требуется вход администратора." }, { status: 401 });
}

export function adminSessionCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${secure}`;
}
