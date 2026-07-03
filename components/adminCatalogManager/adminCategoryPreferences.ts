// ==================================================
// SECTION: Admin — category favorites & recents
// РАЗДЕЛ: Избранные и недавние категории
// ==================================================

const RECENT_KEY = "bellaflore-admin-category-recent";
const FAVORITES_KEY = "bellaflore-admin-category-favorites";
const MAX_RECENT = 6;

function readIds(key: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIds(key: string, ids: string[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(ids));
}

export function getRecentCategoryIds(): string[] {
  return readIds(RECENT_KEY);
}

export function getFavoriteCategoryIds(): string[] {
  return readIds(FAVORITES_KEY);
}

export function recordCategoryUse(categoryId: string): void {
  if (!categoryId) {
    return;
  }

  const recent = readIds(RECENT_KEY).filter((id) => id !== categoryId);
  writeIds(RECENT_KEY, [categoryId, ...recent].slice(0, MAX_RECENT));
}

export function toggleCategoryFavorite(categoryId: string): boolean {
  const favorites = readIds(FAVORITES_KEY);
  const isFavorite = favorites.includes(categoryId);

  if (isFavorite) {
    writeIds(
      FAVORITES_KEY,
      favorites.filter((id) => id !== categoryId),
    );
    return false;
  }

  writeIds(FAVORITES_KEY, [categoryId, ...favorites]);
  return true;
}

export function isCategoryFavorite(categoryId: string): boolean {
  return readIds(FAVORITES_KEY).includes(categoryId);
}
