export const ADMIN_DATA_FETCH_TIMEOUT_MS = 12_000;

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = ADMIN_DATA_FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const parentSignal = init?.signal;
  const abortFromParent = () => controller.abort();
  parentSignal?.addEventListener("abort", abortFromParent);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted && !parentSignal?.aborted) {
      throw new Error("Запрос занял слишком много времени. Проверьте соединение и повторите.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
    parentSignal?.removeEventListener("abort", abortFromParent);
  }
}
