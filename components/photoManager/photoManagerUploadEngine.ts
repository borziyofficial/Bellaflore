// ==================================================
// SECTION: PHOTO MANAGER
// РАЗДЕЛ: Upload engine helpers (client-side only)
// ==================================================
import {
  LOCAL_SEO_PHRASE_DEFAULT,
  PHOTO_MANAGER_PRODUCT_CONTEXT,
} from "@/components/photoManager/photoManagerProductContext";
import type {
  PhotoImageSeo,
  PhotoManagerProductContext,
  PhotoManagerSummary,
  PhotoUploadItem,
} from "@/components/photoManager/photoManagerTypes";

const ACCEPTED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isAcceptedPhotoFile(file: File): boolean {
  return ACCEPTED_MIME_TYPES.has(file.type);
}

export function formatPhotoFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getPhotoFileFormat(file: File): string {
  switch (file.type) {
    case "image/jpeg":
      return "JPEG";
    case "image/png":
      return "PNG";
    case "image/webp":
      return "WEBP";
    default:
      return file.type.replace("image/", "").toUpperCase() || "UNKNOWN";
  }
}

export function slugifySeoFilename(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildAutoPhotoSeo(
  file: File,
  context: PhotoManagerProductContext = PHOTO_MANAGER_PRODUCT_CONTEXT,
): PhotoImageSeo {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const seoSlug = slugifySeoFilename(
    `${context.productName} ${context.city} ${context.brand}`,
  );
  const seoFilename = `${seoSlug || "bellaflore-photo"}.${extension}`;

  return {
    imageTitle: context.productName,
    imageAlt: `${context.productName} с доставкой по ${context.city} — ${context.brand}`,
    imageCaption: `Премиальный букет из ${context.productName.replace(/\D/g, "") || "101"} белой розы с доставкой по ${context.city}.`,
    imageDescription:
      `Авторский букет ${context.brand} для подарка, свадьбы или премиального события. ${LOCAL_SEO_PHRASE_DEFAULT}.`,
    seoFilename,
    canonicalImageUrl: `https://bellaflore.ru/media/catalog/${seoFilename}`,
    openGraphImage: `https://bellaflore.ru/og/${seoFilename}`,
    twitterImage: `https://bellaflore.ru/twitter/${seoFilename}`,
    imageKeywords: `белые розы, 101 роза, ${LOCAL_SEO_PHRASE_DEFAULT}, ${context.intent}, ${context.brand}`,
    localSeoPhrase: LOCAL_SEO_PHRASE_DEFAULT,
  };
}

export function createPhotoUploadItemFromFile(
  file: File,
  photoNumber: number,
  isMain: boolean,
  context?: PhotoManagerProductContext,
): PhotoUploadItem {
  const seo = buildAutoPhotoSeo(file, context);

  return {
    id: `photo-${crypto.randomUUID()}`,
    photoNumber,
    fileName: file.name,
    fileSizeBytes: file.size,
    fileSizeLabel: formatPhotoFileSize(file.size),
    fileFormat: getPhotoFileFormat(file),
    objectUrl: URL.createObjectURL(file),
    isMain,
    seo,
    uploadedAt: new Date().toISOString(),
  };
}

export function renumberPhotos(photos: PhotoUploadItem[]): PhotoUploadItem[] {
  return photos.map((photo, index) => ({
    ...photo,
    photoNumber: index + 1,
  }));
}

export function setMainPhoto(
  photos: PhotoUploadItem[],
  photoId: string,
): PhotoUploadItem[] {
  return photos.map((photo) => ({
    ...photo,
    isMain: photo.id === photoId,
  }));
}

export function movePhoto(
  photos: PhotoUploadItem[],
  photoId: string,
  direction: "up" | "down",
): PhotoUploadItem[] {
  const index = photos.findIndex((photo) => photo.id === photoId);
  if (index === -1) {
    return photos;
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= photos.length) {
    return photos;
  }

  const nextPhotos = [...photos];
  const [moved] = nextPhotos.splice(index, 1);
  nextPhotos.splice(targetIndex, 0, moved);

  return renumberPhotos(nextPhotos);
}

export function revokePhotoObjectUrls(photos: PhotoUploadItem[]): void {
  for (const photo of photos) {
    URL.revokeObjectURL(photo.objectUrl);
  }
}

export function buildPhotoManagerSummary(photos: PhotoUploadItem[]): PhotoManagerSummary {
  const mainPhoto = photos.find((photo) => photo.isMain);
  const totalBytes = photos.reduce((sum, photo) => sum + photo.fileSizeBytes, 0);

  const lastUpdated =
    photos.length > 0
      ? photos
          .map((photo) => photo.uploadedAt)
          .sort()
          .at(-1)
      : null;

  return {
    totalPhotos: photos.length,
    mainPhotoFileName: mainPhoto?.fileName ?? "—",
    totalSizeLabel: photos.length > 0 ? formatPhotoFileSize(totalBytes) : "—",
    lastUpdatedLabel: lastUpdated
      ? new Intl.DateTimeFormat("ru-RU", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(lastUpdated))
      : "—",
  };
}

export function getMainPhoto(photos: PhotoUploadItem[]): PhotoUploadItem | null {
  return photos.find((photo) => photo.isMain) ?? photos[0] ?? null;
}
