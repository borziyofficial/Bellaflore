import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import {
  isAdminRequestAuthorized,
} from "@/lib/adminApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

export async function POST(request: Request) {
  let body: HandleUploadBody;

  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return Response.json(
      { error: "Некорректный запрос загрузки.", message: "Некорректный запрос загрузки." },
      { status: 400 },
    );
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!isAdminRequestAuthorized(request)) {
          throw new Error("Требуется вход администратора.");
        }

        if (!pathname.startsWith("catalog/products/")) {
          throw new Error("Недопустимый путь изображения.");
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_IMAGE_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ scope: "catalog-product-image" }),
        };
      },
      onUploadCompleted: async ({ tokenPayload }) => {
        if (!tokenPayload) {
          return;
        }

        try {
          const payload = JSON.parse(tokenPayload) as { scope?: string };
          if (payload.scope !== "catalog-product-image") {
            throw new Error("INVALID_UPLOAD_SCOPE");
          }
        } catch {
          throw new Error("INVALID_UPLOAD_SCOPE");
        }
      },
    });

    return Response.json(result, {
      headers: { "Cache-Control": "no-store, must-revalidate" },
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Не удалось подготовить загрузку изображения.";

    return Response.json(
      { error: message, message },
      { status: /вход администратора/i.test(message) ? 401 : 400 },
    );
  }
}
