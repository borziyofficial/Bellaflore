// ==================================================
// SECTION: Admin Catalog Manager — image persistence
// РАЗДЕЛ: Серверное хранение фото каталога
// ==================================================

const UPLOAD_ENDPOINT = "/api/admin/products/upload-image";

export type PersistedImageResult = {
  url: string;
  storage: "server" | "blob";
};

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Не удалось прочитать файл."));
      }
    };
    reader.onerror = () => reject(new Error("Не удалось прочитать файл."));
    reader.readAsDataURL(file);
  });
}

export async function persistProductImageFile(
  file: File,
): Promise<PersistedImageResult> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(UPLOAD_ENDPOINT, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const payload = (await response.json()) as {
    imageUrl?: string;
    storage?: "server" | "blob";
    message?: string;
  };

  if (!response.ok) {
    throw new Error(payload.message || "Хранилище изображений не настроено");
  }

  if (!payload.imageUrl) {
    throw new Error("Хранилище изображений не настроено");
  }

  return {
    url: payload.imageUrl,
    storage: payload.storage === "blob" ? "blob" : "server",
  };
}

export function isPersistableImageUrl(url: string): boolean {
  return (
    url.startsWith("/uploads/") ||
    url.startsWith("https://") ||
    url.startsWith("http://")
  );
}

export { shouldUseUnoptimizedImage } from "@/components/images/imageLoadUtils";
