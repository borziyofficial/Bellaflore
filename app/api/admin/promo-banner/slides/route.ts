// ==================================================
// SECTION: Admin API — Promo banner slides (manual mode) — list + create
// ==================================================
import {
  createPromoBannerSlide,
  listPromoBannerSlides,
} from "@/lib/promoBannerDb";
import {
  isAdminRequestAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/adminApiAuth";
import {
  getImageExtension,
  storePromoBannerImage,
} from "@/lib/catalogStorage/imageStorage";
import { getImageStorageWarning } from "@/lib/catalogStorage/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const slides = await listPromoBannerSlides();
    return Response.json(
      { slides },
      { headers: { "Cache-Control": "no-store, must-revalidate" } },
    );
  } catch {
    return Response.json({ message: "Не удалось загрузить слайды." }, { status: 500 });
  }
}

// Accepts multipart/form-data so a slide (including its image) can be
// created in a single request: fields "title", "subtitle", "buttonText",
// "buttonLink", "isEnabled" ("true"/"false") + optional "image" file.
export async function POST(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ message: "Некорректные данные слайда." }, { status: 400 });
  }

  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const buttonText = String(formData.get("buttonText") ?? "").trim();
  const buttonLink = String(formData.get("buttonLink") ?? "").trim();
  const isEnabled = formData.get("isEnabled") !== "false";

  let imageUrl = "";
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const storageWarning = getImageStorageWarning();
    if (storageWarning) {
      return Response.json({ message: storageWarning }, { status: 503 });
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return Response.json({ message: "Изображение слишком большое." }, { status: 413 });
    }
    if (!getImageExtension(image)) {
      return Response.json({ message: "Неподдерживаемый формат изображения." }, { status: 415 });
    }
    try {
      const stored = await storePromoBannerImage(image);
      imageUrl = stored.imageUrl;
    } catch (error) {
      if (error instanceof Error && error.message === "IMAGE_STORAGE_NOT_CONFIGURED") {
        return Response.json({ message: "Хранилище изображений не настроено" }, { status: 503 });
      }
      return Response.json({ message: "Не удалось сохранить изображение." }, { status: 500 });
    }
  }

  try {
    const slide = await createPromoBannerSlide({
      title,
      subtitle,
      buttonText,
      buttonLink,
      imageUrl,
      isEnabled,
    });
    return Response.json({ slide });
  } catch {
    return Response.json({ message: "Не удалось создать слайд." }, { status: 500 });
  }
}
