import {
  isAdminRequestAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/adminApiAuth";
import {
  getImageExtension,
  storeVisualStoryImage,
} from "@/lib/catalogStorage/imageStorage";
import { getImageStorageWarning } from "@/lib/catalogStorage/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  const storageWarning = getImageStorageWarning();
  if (storageWarning) {
    return Response.json({ message: storageWarning }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { message: "Не удалось прочитать изображение." },
      { status: 400 },
    );
  }

  const image = formData.get("image");
  if (!(image instanceof File)) {
    return Response.json(
      { message: "Выберите изображение." },
      { status: 400 },
    );
  }

  if (image.size <= 0) {
    return Response.json({ message: "Файл пустой." }, { status: 400 });
  }

  if (image.size > MAX_IMAGE_BYTES) {
    return Response.json(
      { message: "Фото слишком большое. Максимум 15 МБ." },
      { status: 413 },
    );
  }

  if (!getImageExtension(image)) {
    return Response.json(
      { message: "Формат изображения не поддерживается." },
      { status: 415 },
    );
  }

  try {
    const stored = await storeVisualStoryImage(image);
    return Response.json({
      imageUrl: stored.imageUrl,
      storage: stored.storage,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "IMAGE_STORAGE_NOT_CONFIGURED"
    ) {
      return Response.json(
        { message: "Хранилище изображений не настроено." },
        { status: 503 },
      );
    }

    return Response.json(
      { message: "Не удалось сохранить изображение." },
      { status: 500 },
    );
  }
}
