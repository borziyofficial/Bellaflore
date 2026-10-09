// Numeric order of a permanent BF article. "BF-11" stays before "BF-100".
export function compareCatalogArticles(
  left: string | null | undefined,
  right: string | null | undefined,
): number {
  const leftOrder = catalogArticleNumber(left);
  const rightOrder = catalogArticleNumber(right);

  if (leftOrder !== null && rightOrder !== null) {
    return leftOrder - rightOrder;
  }

  if (leftOrder !== null) {
    return -1;
  }

  if (rightOrder !== null) {
    return 1;
  }

  return 0;
}

function catalogArticleNumber(value: string | null | undefined): number | null {
  const match = value?.match(/(\d+)\s*$/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  return Number.isSafeInteger(parsed) ? parsed : null;
}
