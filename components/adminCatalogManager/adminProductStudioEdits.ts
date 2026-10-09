import type { AdminProductImageDraft } from "@/components/adminCatalogManager/adminCatalogTypes";

export function isAdminFormDirty(current: string, baseline: string): boolean {
  return current !== baseline;
}

export function moveAdminImages(
  images: AdminProductImageDraft[],
  imageId: string,
  direction: -1 | 1,
): AdminProductImageDraft[] | null {
  const ordered = [...images].sort((left, right) => left.sortOrder - right.sortOrder);
  const index = ordered.findIndex((image) => image.id === imageId);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) {
    return null;
  }

  const [image] = ordered.splice(index, 1);
  ordered.splice(nextIndex, 0, image);
  return ordered.map((item, itemIndex) => ({ ...item, sortOrder: itemIndex }));
}

export function markPrimaryAdminImage(
  images: AdminProductImageDraft[],
  imageId: string,
): AdminProductImageDraft[] {
  return images.map((image) => ({
    ...image,
    isPrimary: image.id === imageId,
  }));
}
