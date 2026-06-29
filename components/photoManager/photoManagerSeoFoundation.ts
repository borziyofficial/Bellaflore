// ==================================================
// SECTION: PHOTO MANAGER
// РАЗДЕЛ: SEO image score + checklist
// ==================================================
import { LOCAL_SEO_PHRASE_DEFAULT } from "@/components/photoManager/photoManagerProductContext";
import type {
  PhotoImageSeoScore,
  PhotoUploadItem,
} from "@/components/photoManager/photoManagerTypes";

const ACCEPTED_FORMATS = new Set(["JPEG", "PNG", "WEBP"]);

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

export function buildPhotoImageSeoScore(
  photo: PhotoUploadItem | null,
  hasMainPhoto: boolean,
): PhotoImageSeoScore {
  if (!photo) {
    return {
      score: 0,
      checklist: [
        { id: "empty", label: "Выберите фото для SEO-оценки", passed: false },
      ],
    };
  }

  const checklist = [
    {
      id: "alt",
      label: "ALT заполнен",
      passed: hasText(photo.seo.imageAlt),
    },
    {
      id: "filename",
      label: "SEO filename создан",
      passed: hasText(photo.seo.seoFilename),
    },
    {
      id: "caption",
      label: "Caption заполнен",
      passed: hasText(photo.seo.imageCaption),
    },
    {
      id: "description",
      label: "Description заполнено",
      passed: hasText(photo.seo.imageDescription),
    },
    {
      id: "main",
      label: "Главное фото выбрано",
      passed: hasMainPhoto,
    },
    {
      id: "format",
      label: "Формат JPG/PNG/WebP",
      passed: ACCEPTED_FORMATS.has(photo.fileFormat),
    },
    {
      id: "size",
      label: "Размер файла отображается",
      passed: photo.fileSizeBytes > 0 && hasText(photo.fileSizeLabel),
    },
    {
      id: "title",
      label: "Нет пустого title",
      passed: hasText(photo.seo.imageTitle),
    },
    {
      id: "local",
      label: "Local SEO phrase есть",
      passed:
        photo.seo.localSeoPhrase.toLowerCase().includes(LOCAL_SEO_PHRASE_DEFAULT) ||
        photo.seo.imageKeywords.toLowerCase().includes(LOCAL_SEO_PHRASE_DEFAULT),
    },
    {
      id: "og",
      label: "OG image placeholder готов",
      passed: hasText(photo.seo.openGraphImage),
    },
  ];

  const passedCount = checklist.filter((item) => item.passed).length;
  const score = Math.round((passedCount / checklist.length) * 100);

  return { score, checklist };
}

export function applyMockAiSeoSuggestions(photo: PhotoUploadItem): PhotoUploadItem {
  return {
    ...photo,
    seo: {
      ...photo.seo,
      imageTitle: photo.seo.imageTitle || "Белые розы 101",
      imageAlt:
        photo.seo.imageAlt ||
        "Белые розы 101 с доставкой по Москве — Bellaflore",
      imageCaption:
        photo.seo.imageCaption ||
        "Премиальный букет из 101 белой розы с доставкой по Москве.",
      imageDescription:
        photo.seo.imageDescription ||
        "Авторский букет Bellaflore для подарка, свадьбы или премиального события. Доставка цветов по Москве.",
      imageKeywords:
        photo.seo.imageKeywords ||
        "белые розы, 101 роза, доставка цветов Москва, купить букет, Bellaflore",
      localSeoPhrase: photo.seo.localSeoPhrase || LOCAL_SEO_PHRASE_DEFAULT,
    },
  };
}
