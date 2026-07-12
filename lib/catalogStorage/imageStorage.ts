import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { put } from "@vercel/blob";
import { isImageStorageConfigured } from "@/lib/catalogStorage/config";

const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/heic", ".heic"],
  ["image/heif", ".heif"],
]);

export function getImageExtension(file: File): string | null {
  const extensionFromType = ALLOWED_IMAGE_TYPES.get(file.type);
  if (extensionFromType) {
    return extensionFromType;
  }

  const extensionFromName = extname(file.name).toLowerCase();
  return Array.from(ALLOWED_IMAGE_TYPES.values()).includes(extensionFromName)
    ? extensionFromName
    : null;
}

export type StoredImageResult = {
  imageUrl: string;
  storage: "blob" | "server";
};

export async function storeCatalogProductImage(
  file: File,
): Promise<StoredImageResult> {
  const extension = getImageExtension(file);
  if (!extension) {
    throw new Error("UNSUPPORTED_IMAGE_TYPE");
  }

  const filename = `${randomUUID()}${extension}`;
  const imageBytes = Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    const blob = await put(`catalog/products/${filename}`, imageBytes, {
      access: "public",
      contentType: file.type || "application/octet-stream",
    });

    return {
      imageUrl: blob.url,
      storage: "blob",
    };
  }

  if (process.env.NODE_ENV !== "production") {
    const uploadDirectory = join(process.cwd(), "public", "uploads", "products");
    const destinationPath = join(uploadDirectory, filename);
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(destinationPath, imageBytes);

    return {
      imageUrl: `/uploads/products/${filename}`,
      storage: "server",
    };
  }

  if (!isImageStorageConfigured()) {
    throw new Error("IMAGE_STORAGE_NOT_CONFIGURED");
  }

  throw new Error("IMAGE_STORAGE_NOT_CONFIGURED");
}
