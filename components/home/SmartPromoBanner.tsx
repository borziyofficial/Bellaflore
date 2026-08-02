// ==================================================
// SECTION: SMART PROMO BANNER
// РАЗДЕЛ: Умный промо-баннер (между Hero и каталогом)
//
// Independent from the Hero — see components/home/HeroSection.tsx, which is
// untouched. This renders admin-managed promotional slides (manual or
// auto-generated from the live catalog) directly below the Hero. If there
// are no enabled slides it renders nothing at all.
// ==================================================
"use client";

import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import styles from "@/components/home/SmartPromoBanner.module.css";

export type SmartPromoSlide = {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
};

type SmartPromoBannerProps = {
  /** Controlled slides are used by the admin preview so it renders the
   * exact storefront component instead of a separate approximation. */
  slides?: SmartPromoSlide[] | null;
  preview?: boolean;
};

const AUTOPLAY_INTERVAL_MS = 4000;
const SWIPE_THRESHOLD_PX = 40;

function resolveBannerLink(link: string): string {
  const trimmedLink = link.trim();
  if (!trimmedLink) {
    return "/#catalog";
  }

  try {
    const url = new URL(trimmedLink, "https://bellaflore.ru");
    if (url.hostname === "bellaflore.ru" || url.hostname === "www.bellaflore.ru") {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return trimmedLink;
  }

  return trimmedLink;
}

function isExternalLink(link: string): boolean {
  return /^https?:\/\//i.test(link);
}

function hasMeaningfulBannerText(value: string): boolean {
  return /[\p{L}]/u.test(value.trim());
}

export function SmartPromoBanner({
  slides: controlledSlides,
  preview = false,
}: SmartPromoBannerProps = {}) {
  const [loadedSlides, setLoadedSlides] = useState<SmartPromoSlide[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef(0);

  useEffect(() => {
    if (controlledSlides !== undefined) {
      return;
    }

    let active = true;
    const controller = new AbortController();

    fetch("/api/promo-banner", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as { slides?: SmartPromoSlide[] };
        if (!response.ok) {
          throw new Error("Promo banner request failed");
        }
        return body;
      })
      .then((body) => {
        if (!active) {
          return;
        }
        const validSlides = (body.slides ?? []).filter((slide) => slide.imageUrl);
        setLoadedSlides(validSlides);
      })
      .catch(() => {
        if (active) {
          setLoadedSlides([]);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [controlledSlides]);

  const slides = controlledSlides === undefined ? loadedSlides : controlledSlides;

  const slideCount = slides?.length ?? 0;
  const safeActiveIndex = slideCount === 0 ? 0 : activeIndex % slideCount;

  useEffect(() => {
    const handleVisibilityChange = () => setIsPageVisible(!document.hidden);
    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (slideCount === 0) {
        return;
      }
      setActiveIndex(((index % slideCount) + slideCount) % slideCount);
    },
    [slideCount],
  );

  const goNext = useCallback(() => goTo(safeActiveIndex + 1), [safeActiveIndex, goTo]);
  const goPrev = useCallback(() => goTo(safeActiveIndex - 1), [safeActiveIndex, goTo]);

  // Autoplay — paused on hover/touch interaction, and naturally inert when
  // there's only one slide (no dots, no movement needed).
  useEffect(() => {
    if (slideCount <= 1 || isPaused || !isPageVisible) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slideCount);
    }, AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [slideCount, isPaused, isPageVisible]);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
    touchDeltaXRef.current = 0;
    setIsPaused(true);
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) {
      return;
    }
    const currentX = event.touches[0]?.clientX ?? touchStartXRef.current;
    touchDeltaXRef.current = currentX - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    if (Math.abs(touchDeltaXRef.current) >= SWIPE_THRESHOLD_PX) {
      if (touchDeltaXRef.current < 0) {
        goNext();
      } else {
        goPrev();
      }
    }
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
    setIsPaused(false);
  };

  // Nothing fetched yet, or fetched and empty — the banner takes no space
  // at all (no skeleton) so it can never shift the Hero/catalog layout.
  if (slides === null) {
    return (
      <section
        className={`${styles.section} ${preview ? styles.previewSection : ""}`.trim()}
        aria-label="Загрузка специальных предложений"
        aria-busy="true"
      >
        <div className={`${styles.viewport} ${styles.skeleton}`} />
      </section>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <section
      className={`${styles.section} ${preview ? styles.previewSection : ""}`.trim()}
      aria-label="Специальные предложения"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsPaused(false);
        }
      }}
    >
      <div
        className={styles.viewport}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div
          className={styles.track}
          style={{ transform: `translateX(-${safeActiveIndex * 100}%)` }}
        >
          {slides.map((slide, index) => {
            const isFirst = index === 0;
            const href = resolveBannerLink(slide.buttonLink);
            const external = isExternalLink(href);
            const title = hasMeaningfulBannerText(slide.title) ? slide.title : "";
            const subtitle = hasMeaningfulBannerText(slide.subtitle) ? slide.subtitle : "";
            const buttonText = hasMeaningfulBannerText(slide.buttonText)
              ? slide.buttonText
              : "";

            return (
              <article
                className={`${styles.slide} ${index === safeActiveIndex ? styles.slideActive : ""}`}
                key={slide.id}
                aria-hidden={index !== safeActiveIndex}
                inert={index !== safeActiveIndex}
              >
                <div className={styles.imageWrap}>
                  {/* Plain <img>, not next/image — banner images can come from
                      arbitrary admin uploads (Vercel Blob) with no fixed
                      remote-pattern config, same approach already used for
                      admin-uploaded images elsewhere in the admin panel. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.imageUrl}
                    alt={title || "Специальное предложение"}
                    className={styles.image}
                    loading={isFirst ? "eager" : "lazy"}
                    fetchPriority={isFirst ? "high" : "auto"}
                    decoding="async"
                  />
                  <div className={styles.overlay} />
                </div>

                <div className={styles.content}>
                  {title ? <h2 className={styles.title}>{title}</h2> : null}
                  {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
                  {buttonText ? (
                    <a
                      href={href}
                      className={styles.actionButton}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {buttonText}
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        {slideCount > 1 ? (
          <>
            <button
              type="button"
              className={`${styles.navButton} ${styles.navButtonPrev}`}
              onClick={goPrev}
              aria-label="Предыдущий слайд"
            >
              <svg aria-hidden="true" viewBox="0 0 12 12">
                <path d="M8 2 4 6l4 4" />
              </svg>
            </button>
            <button
              type="button"
              className={`${styles.navButton} ${styles.navButtonNext}`}
              onClick={goNext}
              aria-label="Следующий слайд"
            >
              <svg aria-hidden="true" viewBox="0 0 12 12">
                <path d="M4 2l4 4-4 4" />
              </svg>
            </button>
          </>
        ) : null}
      </div>

      {slideCount > 1 ? (
        <>
          <div className={styles.dots} role="tablist" aria-label="Слайды баннера">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={index === safeActiveIndex}
                aria-label={`Слайд ${index + 1}`}
                className={`${styles.dot} ${index === safeActiveIndex ? styles.dotActive : ""}`}
                onClick={() => goTo(index)}
              />
            ))}
          </div>
          <p className={styles.slideStatus} aria-live="polite">
            {safeActiveIndex + 1} из {slideCount}
          </p>
        </>
      ) : null}
    </section>
  );
}
