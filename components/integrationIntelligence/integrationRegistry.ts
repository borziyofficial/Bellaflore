// ==================================================
// SECTION: INTEGRATION INTELLIGENCE
// РАЗДЕЛ: Integration registry (external APIs & webhooks)
// ==================================================
import { buildIntegrationExampleRegistryState } from "@/components/integrationIntelligence/integrationExamples";
import type {
  ExternalApiEntry,
  ExternalApiStatus,
  WebhookEntry,
  WebhookStatus,
} from "@/components/integrationIntelligence/integrationTypes";

export const INTEGRATION_EXTERNAL_API_STORAGE_KEY =
  "bellaflore_integration_intelligence_external_api_v1";

export const INTEGRATION_WEBHOOK_STORAGE_KEY =
  "bellaflore_integration_intelligence_webhook_v1";

let inMemoryExternalApis: ExternalApiEntry[] | null = null;
let inMemoryWebhooks: WebhookEntry[] | null = null;

function readExternalApisFromStorage(): ExternalApiEntry[] {
  if (typeof window === "undefined") {
    return inMemoryExternalApis ?? buildIntegrationExampleRegistryState().externalApis;
  }

  try {
    const raw = window.localStorage.getItem(INTEGRATION_EXTERNAL_API_STORAGE_KEY);
    if (!raw) {
      return inMemoryExternalApis ?? buildIntegrationExampleRegistryState().externalApis;
    }

    const parsed = JSON.parse(raw) as ExternalApiEntry[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildIntegrationExampleRegistryState().externalApis;
  } catch {
    return inMemoryExternalApis ?? buildIntegrationExampleRegistryState().externalApis;
  }
}

function writeExternalApisToStorage(entries: ExternalApiEntry[]): void {
  inMemoryExternalApis = entries;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(INTEGRATION_EXTERNAL_API_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // In-memory fallback remains active.
  }
}

function readWebhooksFromStorage(): WebhookEntry[] {
  if (typeof window === "undefined") {
    return inMemoryWebhooks ?? buildIntegrationExampleRegistryState().webhooks;
  }

  try {
    const raw = window.localStorage.getItem(INTEGRATION_WEBHOOK_STORAGE_KEY);
    if (!raw) {
      return inMemoryWebhooks ?? buildIntegrationExampleRegistryState().webhooks;
    }

    const parsed = JSON.parse(raw) as WebhookEntry[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildIntegrationExampleRegistryState().webhooks;
  } catch {
    return inMemoryWebhooks ?? buildIntegrationExampleRegistryState().webhooks;
  }
}

function writeWebhooksToStorage(entries: WebhookEntry[]): void {
  inMemoryWebhooks = entries;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(INTEGRATION_WEBHOOK_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // In-memory fallback remains active.
  }
}

export function listExternalApis(status?: ExternalApiStatus): ExternalApiEntry[] {
  return readExternalApisFromStorage().filter((api) =>
    status ? api.status === status : true,
  );
}

export function getExternalApiById(apiId: string): ExternalApiEntry | null {
  return readExternalApisFromStorage().find((api) => api.id === apiId) ?? null;
}

export function listActiveExternalApis(): ExternalApiEntry[] {
  return listExternalApis("active");
}

export function listWebhooks(status?: WebhookStatus): WebhookEntry[] {
  return readWebhooksFromStorage().filter((webhook) =>
    status ? webhook.status === status : true,
  );
}

export function getWebhookById(webhookId: string): WebhookEntry | null {
  return readWebhooksFromStorage().find((w) => w.id === webhookId) ?? null;
}

export function getWebhookByEventType(eventType: string): WebhookEntry | null {
  return readWebhooksFromStorage().find((w) => w.eventType === eventType) ?? null;
}

export function registerExternalApi(entry: ExternalApiEntry): ExternalApiEntry {
  const entries = readExternalApisFromStorage();
  const index = entries.findIndex((e) => e.id === entry.id);
  const next =
    index === -1
      ? [...entries, entry]
      : entries.map((e, i) => (i === index ? entry : e));

  writeExternalApisToStorage(next);
  return entry;
}

export function registerWebhook(entry: WebhookEntry): WebhookEntry {
  const entries = readWebhooksFromStorage();
  const index = entries.findIndex((e) => e.id === entry.id);
  const next =
    index === -1
      ? [...entries, entry]
      : entries.map((e, i) => (i === index ? entry : e));

  writeWebhooksToStorage(next);
  return entry;
}

export function seedIntegrationRegistry(): ExternalApiEntry[] {
  const seed = buildIntegrationExampleRegistryState();
  writeExternalApisToStorage(seed.externalApis);
  writeWebhooksToStorage(seed.webhooks);
  return listExternalApis();
}

export function clearIntegrationRegistry(): void {
  writeExternalApisToStorage([]);
  writeWebhooksToStorage([]);
}
