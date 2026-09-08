import { expect, test } from "@playwright/test";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
} from "../../lib/adminApiAuth";
import { POST as logoutPost } from "../../app/api/admin/logout/route";
import { GET as sessionGet } from "../../app/api/admin/session/route";

test("admin session endpoint is protected and logout clears the session cookie", async () => {
  const previousSecret = process.env.ADMIN_SESSION_SECRET;
  process.env.ADMIN_SESSION_SECRET = "admin-auth-api-test-secret";

  try {
    const unauthenticated = await sessionGet(
      new Request("https://example.test/api/admin/session"),
    );
    expect(unauthenticated.status).toBe(401);

    const token = createAdminSessionToken("admin-auth-test-user");
    const authenticated = await sessionGet(
      new Request("https://example.test/api/admin/session", {
        headers: {
          cookie: `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}`,
        },
      }),
    );
    expect(authenticated.status).toBe(200);
    await expect(authenticated.json()).resolves.toEqual({ authenticated: true });

    const logout = await logoutPost();
    expect(logout.status).toBe(200);
    await expect(logout.json()).resolves.toEqual({ authenticated: false });

    const setCookie = logout.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${ADMIN_SESSION_COOKIE}=`);
    expect(setCookie).toContain("Max-Age=0");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
  } finally {
    if (previousSecret === undefined) {
      delete process.env.ADMIN_SESSION_SECRET;
    } else {
      process.env.ADMIN_SESSION_SECRET = previousSecret;
    }
  }
});
