// ==================================================
// SECTION: Catalog Product Slug
// РАЗДЕЛ: Latin slug transliteration for catalog products
// ==================================================

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

const LATIN_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function transliterateRussian(value: string): string {
  return [...value.toLowerCase()].map((char) => CYRILLIC_TO_LATIN[char] ?? char).join("");
}

export function slugifyCatalogProductTitle(value: string): string {
  const transliterated = transliterateRussian(value.trim());

  return transliterated
    .replace(/[^a-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function hasCyrillicSlug(value: string): boolean {
  return /[а-яё]/i.test(value);
}

export function isLatinCatalogSlug(value: string): boolean {
  return LATIN_SLUG_PATTERN.test(value.trim());
}

export function resolveLatinCatalogSlug(
  title: string,
  currentSlug = "",
  seoSlug = "",
): string {
  const candidates = [seoSlug.trim(), currentSlug.trim(), title.trim()].filter(Boolean);

  for (const candidate of candidates) {
    if (isLatinCatalogSlug(candidate)) {
      return candidate;
    }
  }

  for (const candidate of candidates) {
    const latin = slugifyCatalogProductTitle(candidate);
    if (latin) {
      return latin;
    }
  }

  return slugifyCatalogProductTitle(title);
}
