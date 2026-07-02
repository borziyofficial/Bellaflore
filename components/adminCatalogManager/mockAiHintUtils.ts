// ==================================================
// SECTION: Admin Catalog Manager — AI hint utilities
// РАЗДЕЛ: Нормализация подсказок для mock AI
// ==================================================

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const HEX_BLOB_PATTERN = /^[0-9a-f]{16,}$/i;

const ADMIN_PRODUCT_ID_PATTERN = /^admin-product-/i;

const GENERIC_FILE_NAME_PATTERN =
  /^(img|image|photo|picture|pic|dsc|dscn|pxl|screenshot|upload|file|blob|camera|scan|tmp|temp|untitled|новый|фото|изображение)([-_\s]?\d*)?$/i;

function stripFileExtension(value: string): string {
  return value.replace(/\.[^.]+$/, "").trim();
}

function normalizeHintText(value: string): string {
  return stripFileExtension(value)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isGarbageAiHint(value: string): boolean {
  const normalized = normalizeHintText(value);
  if (!normalized) {
    return true;
  }

  if (UUID_PATTERN.test(normalized)) {
    return true;
  }

  if (HEX_BLOB_PATTERN.test(normalized.replace(/\s/g, ""))) {
    return true;
  }

  if (ADMIN_PRODUCT_ID_PATTERN.test(normalized)) {
    return true;
  }

  if (/^\d+$/.test(normalized)) {
    return true;
  }

  if (GENERIC_FILE_NAME_PATTERN.test(normalized)) {
    return true;
  }

  if (normalized.length < 2) {
    return true;
  }

  return false;
}

export function isGarbageProductTitle(value: string): boolean {
  return isGarbageAiHint(value);
}

export function formatBouquetTitle(value: string): string {
  const normalized = normalizeHintText(value);
  if (!normalized || isGarbageAiHint(normalized)) {
    return "";
  }

  if (/[а-яё]/i.test(normalized)) {
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

type ResolveAiHintInput = {
  fileName?: string;
  formTitle?: string;
  fallback?: string;
};

export function resolveAiHint({
  fileName = "",
  formTitle = "",
  fallback = "Авторский букет",
}: ResolveAiHintInput = {}): string {
  const candidates = [
    normalizeHintText(formTitle),
    normalizeHintText(fileName),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (!isGarbageAiHint(candidate)) {
      return formatBouquetTitle(candidate) || candidate;
    }
  }

  return fallback;
}
