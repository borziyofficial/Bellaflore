// ==================================================
// SECTION: HEALTH INTELLIGENCE
// РАЗДЕЛ: Catalog health bridge (read-only)
// ==================================================
import type { HealthCheckResult } from "@/components/healthIntelligence/healthIntelligenceTypes";
import { readAiCatalogSnapshot } from "@/components/aiBrain/aiCatalogBridge";
import { getPublishedCatalogProducts } from "@/components/catalogEngine/productCatalogEngine";

function buildResult(
  checkId: string,
  passed: boolean,
  severity: HealthCheckResult["severity"],
  status: HealthCheckResult["status"],
  message: string,
  metadata: Record<string, unknown> = {},
): HealthCheckResult {
  return {
    checkId,
    moduleId: "catalogEngine",
    status,
    severity,
    passed,
    message,
    checkedAt: new Date().toISOString(),
    metadata,
  };
}

export function readHealthCatalogSnapshot() {
  return readAiCatalogSnapshot();
}

export function runHealthCatalogChecks(): HealthCheckResult[] {
  const snapshot = readAiCatalogSnapshot();
  const published = getPublishedCatalogProducts();

  const unavailableRatio =
    published.length > 0
      ? snapshot.unavailableProductIds.length / published.length
      : 0;

  return [
    buildResult(
      "catalog_published_products",
      published.length > 0,
      published.length === 0 ? "critical" : "info",
      published.length === 0 ? "offline" : "healthy",
      published.length === 0
        ? "Нет опубликованных товаров"
        : `Published products: ${published.length}`,
      { publishedCount: published.length },
    ),
    buildResult(
      "catalog_unavailable_ratio",
      unavailableRatio < 0.4,
      unavailableRatio >= 0.5 ? "high" : unavailableRatio >= 0.4 ? "medium" : "info",
      unavailableRatio >= 0.4 ? "warning" : "healthy",
      `Unavailable ratio: ${Math.round(unavailableRatio * 100)}%`,
      { unavailableRatio },
    ),
  ];
}
