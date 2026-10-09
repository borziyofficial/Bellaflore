import assert from "node:assert/strict";
import { test } from "node:test";
import { adminSessionCookieHeader } from "../../lib/adminApiAuth.ts";
import {
  checkAdminServerSession,
  continueAdminAfterServerSession,
} from "../../lib/adminSessionCheck.ts";

function jsonResponse(status: number): Response {
  return new Response(JSON.stringify({ authenticated: status === 200 }), { status });
}

test("valid server session is accepted only when the session endpoint succeeds", async () => {
  let credentials: RequestCredentials | undefined;
  const result = await checkAdminServerSession({
    fetchImpl: async (_input, init) => {
      credentials = init?.credentials;
      return jsonResponse(200);
    },
  });

  assert.equal(result.status, "valid");
  assert.equal(credentials, "include");
});

test("expired server session stays closed", async () => {
  const result = await checkAdminServerSession({
    fetchImpl: async () => jsonResponse(401),
  });

  assert.equal(result.status, "invalid");
});

test("session API error does not count as a valid session", async () => {
  const result = await checkAdminServerSession({
    fetchImpl: async () => jsonResponse(500),
  });

  assert.equal(result.status, "unavailable");
  assert.match(result.status === "unavailable" ? result.message : "", /сессию/i);
});

test("session check times out instead of waiting forever", async () => {
  const result = await checkAdminServerSession({
    timeoutMs: 20,
    fetchImpl: (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const error = new Error("The operation was aborted");
          error.name = "AbortError";
          reject(error);
        });
      }),
  });

  assert.equal(result.status, "unavailable");
  assert.match(result.status === "unavailable" ? result.message : "", /слишком много времени/);
});

test("a slow successful session check is not aborted when the caller waits", async () => {
  let aborted = false;
  const result = await checkAdminServerSession({
    timeoutMs: 0,
    fetchImpl: (_input, init) =>
      new Promise((resolve) => {
        init?.signal?.addEventListener("abort", () => {
          aborted = true;
        });
        setTimeout(() => resolve(jsonResponse(200)), 40);
      }),
  });

  assert.equal(aborted, false);
  assert.equal(result.status, "valid");
});

test("expired session logs the admin out, a failed check only shows a notice", () => {
  assert.equal(continueAdminAfterServerSession({ status: "invalid" }), "login");
  assert.equal(continueAdminAfterServerSession({ status: "valid" }), "render");
  assert.equal(
    continueAdminAfterServerSession({
      status: "unavailable",
      message: "Проверка доступа заняла слишком много времени. Проверьте соединение и повторите.",
    }),
    "notice",
  );
});

test("admin session cookie is the same for desktop and mobile clients", () => {
  const header = adminSessionCookieHeader("desktop-and-mobile-token");

  assert.match(header, /^bellaflore_admin_session=/);
  assert.match(header, /HttpOnly/);
  assert.match(header, /SameSite=Lax/);
  assert.match(header, /Path=\//);
  assert.doesNotMatch(header, /User-Agent|Mobile|Desktop/);
});
