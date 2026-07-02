// ==================================================
// SECTION: Admin API — Product Image Upload
// РАЗДЕЛ: Admin API — загрузка изображения товара
// ==================================================
import {
  isAdminRequestAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/adminApiAuth";
import {
  getImageExtension,
  storeCatalogProductImage,
} from "@/lib/catalogStorage/imageStorage";
import { getImageStorageWarning } from "@/lib/catalogStorage/config";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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
    return Response.json({ message: "Не удалось загрузить изображение." }, { status: 400 });
  }

  const image = formData.get("image");
  if (!(image instanceof File)) {
    return Response.json({ message: "Выберите файл изображения." }, { status: 400 });
  }

  if (image.size <= 0) {
    return Response.json({ message: "Файл изображения пустой." }, { status: 400 });
  }

  if (image.size > MAX_IMAGE_BYTES) {
    return Response.json({ message: "Изображение слишком большое." }, { status: 413 });
  }

  if (!getImageExtension(image)) {
    return Response.json({ message: "Неподдерживаемый формат изображения." }, { status: 415 });
  }

  try {
    const stored = await storeCatalogProductImage(image);
    return Response.json({
      imageUrl: stored.imageUrl,
      storage: stored.storage,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "IMAGE_STORAGE_NOT_CONFIGURED") {
      return Response.json({ message: "Хранилище изображений не настроено" }, { status: 503 });
    }

    return Response.json({ message: "Не удалось сохранить изображение." }, { status: 500 });
  }
}
