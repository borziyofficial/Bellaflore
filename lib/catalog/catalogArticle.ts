export class CatalogArticleFormatError extends Error {
  constructor() {
    super("Артикул должен быть числом, например 2 или BF-002.");
    this.name = "CatalogArticleFormatError";
  }
}

export class CatalogArticleTakenError extends Error {
  readonly article: string;

  constructor(article: string) {
    super(`Артикул ${article} уже занят.`);
    this.name = "CatalogArticleTakenError";
    this.article = article;
  }
}

export function normalizeCatalogArticle(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(?:bf[-\s]*)?(\d+)$/i);
  if (!match) {
    throw new CatalogArticleFormatError();
  }

  const number = Number(match[1]);
  if (!Number.isInteger(number) || number < 1 || number > 9999) {
    throw new CatalogArticleFormatError();
  }

  return `BF-${String(number).padStart(3, "0")}`;
}

export function catalogArticleKey(value: string | null | undefined): string | null {
  try {
    return normalizeCatalogArticle(value);
  } catch {
    return null;
  }
}
