// ==================================================
// SECTION: Admin Catalog Manager — image persistence
// РАЗДЕЛ: Стабильное хранение фото (временное base64)
// ==================================================

const UPLOAD_ENDPOINT = "/api/admin/products/upload-image";

export type PersistedImageResult = {
  url: string;
  storage: "server" | "base64";
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

async function uploadImageToServer(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(UPLOAD_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { imageUrl?: string };
    return payload.imageUrl ?? null;
  } catch {
    return null;
  }
}

/**
 * TEMPORARY: until production media storage is wired, base64 data URLs
 * are persisted in catalog localStorage so drafts survive refresh.
 */
export async function persistProductImageFile(
  file: File,
): Promise<PersistedImageResult> {
  const base64Url = await fileToDataUrl(file);
  const serverUrl = await uploadImageToServer(file);

  if (serverUrl) {
    return { url: serverUrl, storage: "server" };
  }

  return { url: base64Url, storage: "base64" };
}

export function isPersistableImageUrl(url: string): boolean {
  return (
    url.startsWith("/uploads/") ||
    url.startsWith("data:image/") ||
    url.startsWith("http")
  );
}

export function shouldUseUnoptimizedImage(url: string): boolean {
  return url.startsWith("blob:") || url.startsWith("data:");
}
