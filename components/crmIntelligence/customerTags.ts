// ==================================================
// SECTION: CRM INTELLIGENCE
// РАЗДЕЛ: Customer tags
// ==================================================
import { buildCrmExampleRegistryState } from "@/components/crmIntelligence/crmExamples";
import type {
  CrmAiPreparation,
  CrmCustomerTagAssignment,
  CrmTag,
} from "@/components/crmIntelligence/crmTypes";

export const CRM_TAGS_STORAGE_KEY =
  "bellaflore_crm_intelligence_tags_v1";

export const CRM_AI_STORAGE_KEY =
  "bellaflore_crm_intelligence_ai_v1";

let inMemoryTags: CrmCustomerTagAssignment[] | null = null;
let inMemoryAi: CrmAiPreparation[] | null = null;

function readTagsFromStorage(): CrmCustomerTagAssignment[] {
  if (typeof window === "undefined") {
    return inMemoryTags ?? buildCrmExampleRegistryState().tagAssignments;
  }

  try {
    const raw = window.localStorage.getItem(CRM_TAGS_STORAGE_KEY);
    if (!raw) {
      return inMemoryTags ?? buildCrmExampleRegistryState().tagAssignments;
    }

    const parsed = JSON.parse(raw) as CrmCustomerTagAssignment[];
    return Array.isArray(parsed)
      ? parsed
      : buildCrmExampleRegistryState().tagAssignments;
  } catch {
    return inMemoryTags ?? buildCrmExampleRegistryState().tagAssignments;
  }
}

function writeTagsToStorage(assignments: CrmCustomerTagAssignment[]): void {
  inMemoryTags = assignments;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CRM_TAGS_STORAGE_KEY, JSON.stringify(assignments));
  } catch {
    // In-memory fallback remains active.
  }
}

function readAiFromStorage(): CrmAiPreparation[] {
  if (typeof window === "undefined") {
    return inMemoryAi ?? buildCrmExampleRegistryState().aiPreparations;
  }

  try {
    const raw = window.localStorage.getItem(CRM_AI_STORAGE_KEY);
    if (!raw) {
      return inMemoryAi ?? buildCrmExampleRegistryState().aiPreparations;
    }

    const parsed = JSON.parse(raw) as CrmAiPreparation[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildCrmExampleRegistryState().aiPreparations;
  } catch {
    return inMemoryAi ?? buildCrmExampleRegistryState().aiPreparations;
  }
}

function writeAiToStorage(preparations: CrmAiPreparation[]): void {
  inMemoryAi = preparations;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CRM_AI_STORAGE_KEY, JSON.stringify(preparations));
  } catch {
    // In-memory fallback remains active.
  }
}

export const CRM_AVAILABLE_TAGS: CrmTag[] = [
  "vip",
  "loyal",
  "gift_buyer",
  "corporate",
  "at_risk",
  "seasonal",
  "new",
];

export function listCustomerTagAssignments(
  customerId?: string,
): CrmCustomerTagAssignment[] {
  const assignments = readTagsFromStorage();
  return customerId
    ? assignments.filter((a) => a.customerId === customerId)
    : assignments;
}

export function listCustomersByTag(tag: CrmTag): CrmCustomerTagAssignment[] {
  return readTagsFromStorage().filter((a) => a.tag === tag);
}

export function getCustomerTags(customerId: string): CrmTag[] {
  return listCustomerTagAssignments(customerId).map((a) => a.tag);
}

export function registerCustomerTag(
  assignment: CrmCustomerTagAssignment,
): CrmCustomerTagAssignment {
  const assignments = readTagsFromStorage();
  const exists = assignments.some(
    (a) => a.customerId === assignment.customerId && a.tag === assignment.tag,
  );

  if (exists) {
    return assignment;
  }

  writeTagsToStorage([assignment, ...assignments]);
  return assignment;
}

export function removeCustomerTag(customerId: string, tag: CrmTag): void {
  writeTagsToStorage(
    readTagsFromStorage().filter(
      (a) => !(a.customerId === customerId && a.tag === tag),
    ),
  );
}

export function listAiCrmPreparations(): CrmAiPreparation[] {
  return readAiFromStorage();
}

export function getAiCrmPreparationById(id: string): CrmAiPreparation | null {
  return readAiFromStorage().find((p) => p.id === id) ?? null;
}

export function registerAiCrmPreparation(
  preparation: CrmAiPreparation,
): CrmAiPreparation {
  const items = readAiFromStorage();
  const index = items.findIndex((p) => p.id === preparation.id);
  const next =
    index === -1
      ? [...items, preparation]
      : items.map((p, i) => (i === index ? preparation : p));

  writeAiToStorage(next);
  return preparation;
}

export function seedCrmTagsRegistry(): CrmCustomerTagAssignment[] {
  const seed = buildCrmExampleRegistryState();
  writeTagsToStorage(seed.tagAssignments);
  writeAiToStorage(seed.aiPreparations);
  return listCustomerTagAssignments();
}

export function clearCrmTagsRegistry(): void {
  writeTagsToStorage([]);
  writeAiToStorage([]);
}

export function getTagLabel(tag: CrmTag): string {
  const labels: Record<CrmTag, string> = {
    vip: "VIP",
    loyal: "Лояльный",
    gift_buyer: "Покупает в подарок",
    corporate: "Корпоративный",
    at_risk: "At risk",
    seasonal: "Сезонный",
    new: "Новый",
  };

  return labels[tag];
}
