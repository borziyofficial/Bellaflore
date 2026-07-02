export function isImageStorageConfigured(): boolean {
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return true;
  }

  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return false;
}

export function getImageStorageWarning(): string | null {
  if (isImageStorageConfigured()) {
    return null;
  }

  return "Хранилище изображений не настроено";
}

export const IMAGE_STORAGE_SETUP_HINT = [
  "Настройте BLOB_READ_WRITE_TOKEN в Vercel:",
  "1. Vercel Dashboard → Storage → Create Store → Blob",
  "2. Подключите BLOB_READ_WRITE_TOKEN к проекту bellaflore",
  "3. Перезапустите production deploy",
].join("\n");
