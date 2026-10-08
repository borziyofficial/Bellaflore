export function resolveCatalogNumber(
  stored: string | null | undefined,
  computedFallback: string | null | undefined,
): string {
  const storedNumber = stored?.trim() ?? "";
  if (storedNumber) {
    return storedNumber;
  }

  return computedFallback?.trim() ?? "";
}
