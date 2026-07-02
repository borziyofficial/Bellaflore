// ==================================================
// SECTION: AI BRAIN
// РАЗДЕЛ: Future AI provider foundation
// ==================================================
import type {
  AiBrainContext,
  AiBrainExternalHooks,
  AiBrainProviderConfig,
  AiBrainProviderKind,
} from "@/components/aiBrain/aiBrainTypes";

export const AI_BRAIN_PROVIDER_CATALOG: AiBrainProviderConfig[] = [
  {
    kind: "openai",
    enabled: false,
    label: "OpenAI",
    capabilities: {
      canAnalyze: true,
      canRecommend: true,
      canExplain: true,
      canSummarize: true,
    },
  },
  {
    kind: "local_model",
    enabled: false,
    label: "Local model",
    capabilities: {
      canAnalyze: true,
      canRecommend: true,
      canExplain: true,
      canSummarize: false,
    },
  },
  {
    kind: "admin_rules",
    enabled: true,
    label: "Admin-trained rules",
    capabilities: {
      canAnalyze: true,
      canRecommend: true,
      canExplain: true,
      canSummarize: true,
    },
  },
  {
    kind: "vector_memory",
    enabled: false,
    label: "Vector memory",
    capabilities: {
      canAnalyze: false,
      canRecommend: true,
      canExplain: true,
      canSummarize: true,
    },
  },
];

let externalHooks: AiBrainExternalHooks = {};

export function registerAiBrainExternalHooks(
  hooks: AiBrainExternalHooks,
): AiBrainExternalHooks {
  externalHooks = { ...externalHooks, ...hooks };
  return externalHooks;
}

export function getAiBrainExternalHooks(): AiBrainExternalHooks {
  return externalHooks;
}

export function clearAiBrainExternalHooks(): void {
  externalHooks = {};
}

export function listAiBrainProviders(): AiBrainProviderConfig[] {
  return [...AI_BRAIN_PROVIDER_CATALOG];
}

export function getAiBrainProvider(
  kind: AiBrainProviderKind,
): AiBrainProviderConfig | null {
  return AI_BRAIN_PROVIDER_CATALOG.find((provider) => provider.kind === kind) ?? null;
}

export async function analyzeWithExternalProvider(
  context: AiBrainContext,
  provider: AiBrainProviderKind = "admin_rules",
) {
  const config = getAiBrainProvider(provider);
  if (!config?.enabled) {
    return null;
  }

  return externalHooks.analyzeWithProvider?.(context, provider) ?? null;
}

export async function explainWithExternalProvider(
  context: AiBrainContext,
  provider: AiBrainProviderKind = "admin_rules",
) {
  const config = getAiBrainProvider(provider);
  if (!config?.enabled) {
    return null;
  }

  return externalHooks.explainWithProvider?.(context, provider) ?? null;
}

export const AI_BRAIN_PROVIDER_INTEGRATION_SLOTS = [
  {
    id: "openai",
    label: "OpenAI provider adapter",
    status: "ready_for_integration" as const,
  },
  {
    id: "local_model",
    label: "Local model adapter",
    status: "ready_for_integration" as const,
  },
  {
    id: "admin_rules",
    label: "Admin-trained rules engine",
    status: "active_foundation" as const,
  },
  {
    id: "vector_memory",
    label: "Vector memory retrieval",
    status: "ready_for_integration" as const,
  },
];
