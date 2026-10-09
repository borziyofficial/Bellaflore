export const ADMIN_SESSION_CHECK_TIMEOUT_MS = 8_000;

export type AdminServerSessionCheck =
  | { status: "valid" }
  | { status: "invalid" }
  | { status: "unavailable"; message: string };

const SESSION_PATH = "/api/admin/session";

export type AdminGateContinuation = "render" | "login" | "notice";

/** A slow or failed cookie check must not replace the admin. Only a rejected session logs the user out. */
export function continueAdminAfterServerSession(
  check: AdminServerSessionCheck,
): AdminGateContinuation {
  if (check.status === "invalid") {
    return "login";
  }
  if (check.status === "unavailable") {
    return "notice";
  }
  return "render";
}

export async function checkAdminServerSession(options?: {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<AdminServerSessionCheck> {
  const fetchImpl = options?.fetchImpl ?? fetch;
  const timeoutMs = options?.timeoutMs ?? ADMIN_SESSION_CHECK_TIMEOUT_MS;
  const controller = new AbortController();
  const timer =
    timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const response = await fetchImpl(SESSION_PATH, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      signal: timer ? controller.signal : undefined,
    });

    if (response.ok) {
      return { status: "valid" };
    }

    if (response.status === 401 || response.status === 403) {
      return { status: "invalid" };
    }

    return {
      status: "unavailable",
      message: "Сервер не подтвердил сессию. Повторите попытку.",
    };
  } catch (error) {
    const aborted =
      (error instanceof Error && error.name === "AbortError") ||
      controller.signal.aborted;

    return {
      status: "unavailable",
      message: aborted
        ? "Проверка доступа заняла слишком много времени. Проверьте соединение и повторите."
        : "Не удалось проверить доступ. Проверьте соединение и повторите.",
    };
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
