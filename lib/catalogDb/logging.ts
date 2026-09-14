type CatalogErrorMetadata = Record<string, string | number | boolean | null | undefined>;

function safeErrorDetails(error: unknown): Record<string, string> {
  if (!(error instanceof Error)) {
    return { errorType: typeof error };
  }

  const details: Record<string, string> = { errorName: error.name };
  const code = (error as Error & { code?: unknown }).code;
  if (typeof code === "string" && /^[A-Z0-9_]{2,32}$/i.test(code)) {
    details.errorCode = code;
  }
  if (error instanceof TypeError) {
    details.errorMessage = error.message.replace(/[\r\n]/g, " ").slice(0, 160);
  }
  return details;
}

export function logCatalogServerError(
  operation: string,
  error: unknown,
  metadata: CatalogErrorMetadata = {},
): void {
  console.error("[catalog] Server operation failed", {
    operation,
    ...metadata,
    ...safeErrorDetails(error),
  });
}
