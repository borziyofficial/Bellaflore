// ==================================================
// SECTION: CATALOG ENGINE
// РАЗДЕЛ: AI Catalog Foundation
//
// Purpose (EN): Extension points for AI Catalog, Search, Recommendations, Promotions.
//
// Назначение (RU): Точки расширения для AI Catalog / Search / Recommendations.
// ==================================================
import type {
  CatalogAiCapability,
  CatalogAiHookRegistry,
  CatalogEngineSnapshot,
  CatalogSearchQuery,
} from "@/components/catalogEngine/catalogTypes";

let aiHookRegistry: CatalogAiHookRegistry = {};

export function registerCatalogAiHooks(
  hooks: CatalogAiHookRegistry,
): CatalogAiHookRegistry {
  aiHookRegistry = {
    ...aiHookRegistry,
    ...hooks,
  };
  return aiHookRegistry;
}

export function getCatalogAiHooks(): CatalogAiHookRegistry {
  return aiHookRegistry;
}

export function clearCatalogAiHooks(): void {
  aiHookRegistry = {};
}

export function getRegisteredCatalogAiCapabilities(): CatalogAiCapability[] {
  const capabilities: CatalogAiCapability[] = [];

  if (aiHookRegistry.catalog) {
    capabilities.push("catalog");
  }
  if (aiHookRegistry.recommendations) {
    capabilities.push("recommendations");
  }
  if (aiHookRegistry.search) {
    capabilities.push("search");
  }
  if (aiHookRegistry.promotions) {
    capabilities.push("promotions");
  }

  return capabilities;
}

export async function enrichCatalogSnapshotWithAi(
  snapshot: CatalogEngineSnapshot,
): Promise<CatalogEngineSnapshot> {
  if (!aiHookRegistry.catalog) {
    return snapshot;
  }

  return aiHookRegistry.catalog(snapshot);
}

export type AiCatalogPlaceholder = {
  capability: CatalogAiCapability;
  status: "ready_for_integration";
  description: string;
};

export const AI_CATALOG_INTEGRATION_PLACEHOLDERS: AiCatalogPlaceholder[] = [
  {
    capability: "catalog",
    status: "ready_for_integration",
    description: "AI-assisted product enrichment, tagging, and merchandising.",
  },
  {
    capability: "recommendations",
    status: "ready_for_integration",
    description: "Personalized similar / premium / bundle recommendations.",
  },
  {
    capability: "search",
    status: "ready_for_integration",
    description: "Semantic and intent-aware catalog search.",
  },
  {
    capability: "promotions",
    status: "ready_for_integration",
    description: "Dynamic promo pricing and campaign targeting.",
  },
];

export type AiSearchIntegrationContract = {
  query: CatalogSearchQuery;
  expectedResponse: "CatalogSearchHit[]";
};
