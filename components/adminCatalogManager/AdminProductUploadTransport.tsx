"use client";

import { upload } from "@vercel/blob/client";
import { useEffect } from "react";

const SERVER_UPLOAD_ENDPOINT = "/api/admin/products/upload-image";
const CLIENT_UPLOAD_ENDPOINT = "/api/admin/products/client-upload";
const MULTIPART_THRESHOLD_BYTES = 4 * 1024 * 1024;

function sanitizeFilename(filename: string): string {
  const normalized = filename
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "product-image.jpg";
}

function getRequestPath(input: RequestInfo | URL): string | null {
  try {
    const rawUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    return new URL(rawUrl, window.location.origin).pathname;
  } catch {
    return null;
  }
}

function getUploadErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    const message = error.message.trim();
    if (/too large|size|maximum|payload/i.test(message)) {
      return "Файл слишком большой для загрузки. Максимум 20 МБ.";
    }
    if (/unauthorized|auth|401|403|вход/i.test(message)) {
      return "Сессия администратора истекла. Войдите в админку снова.";
    }
    return `Не удалось загрузить изображение: ${message}`;
  }

  return "Не удалось загрузить изображение. Проверьте соединение и повторите.";
}

/**
 * Keeps the existing product studio API contract, but sends image bytes
 * directly from the browser to Vercel Blob. Vercel Functions reject request
 * bodies above 4.5 MB, so proxying the file through a Route Handler is not
 * reliable for high-resolution product photography.
 */
export function AdminProductUploadTransport() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    const directUploadFetch: typeof window.fetch = async (input, init) => {
      const requestPath = getRequestPath(input);
      const method = (init?.method ?? (input instanceof Request ? input.method : "GET"))
        .toUpperCase();

      if (
        requestPath !== SERVER_UPLOAD_ENDPOINT ||
        method !== "POST" ||
        !(init?.body instanceof FormData)
      ) {
        return originalFetch(input, init);
      }

      const image = init.body.get("image");
      if (!(image instanceof File)) {
        return Response.json(
          { message: "Выберите файл изображения." },
          { status: 400 },
        );
      }

      try {
        const blob = await upload(
          `catalog/products/${sanitizeFilename(image.name)}`,
          image,
          {
            access: "public",
            handleUploadUrl: CLIENT_UPLOAD_ENDPOINT,
            contentType: image.type || undefined,
            multipart: image.size >= MULTIPART_THRESHOLD_BYTES,
          },
        );

        return Response.json({
          imageUrl: blob.url,
          storage: "blob",
        });
      } catch (error) {
        return Response.json(
          { message: getUploadErrorMessage(error) },
          { status: 502 },
        );
      }
    };

    window.fetch = directUploadFetch;

    return () => {
      if (window.fetch === directUploadFetch) {
        window.fetch = originalFetch;
      }
    };
  }, []);

  return null;
}
