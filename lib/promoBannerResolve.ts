// ==================================================
// SECTION: Promo banner — resolve final render list
// РАЗДЕЛ: Итоговый список слайдов баннера (ручной или авто режим)
// ==================================================
import {
  getPromoBannerSettings,
  listPromoBannerSlides,
  type PromoBannerSettings,
} from "@/lib/promoBannerDb";
import { resolveAutoPromoSlides, type ResolvedPromoSlide } from "@/lib/promoBannerAuto";

export async function resolvePromoBannerSlidesForSettings(
  settings: PromoBannerSettings,
): Promise<ResolvedPromoSlide[]> {
  if (settings.mode === "auto") {
    return resolveAutoPromoSlides(
      settings.autoSource,
      settings.autoSelectedProductIds,
      settings.autoSlideLimit,
    );
  }

  const slides = await listPromoBannerSlides();
  return slides
    .filter((slide) => slide.isEnabled)
    .sort((left, right) => left.priority - right.priority)
    .map((slide) => ({
      id: slide.id,
      imageUrl: slide.imageUrl,
      title: slide.title,
      subtitle: slide.subtitle,
      buttonText: slide.buttonText,
      buttonLink: slide.buttonLink,
    }));
}

export async function resolveCurrentPromoBannerSlides(): Promise<{
  mode: PromoBannerSettings["mode"];
  slides: ResolvedPromoSlide[];
}> {
  const settings = await getPromoBannerSettings();
  const slides = await resolvePromoBannerSlidesForSettings(settings);
  return { mode: settings.mode, slides };
}
