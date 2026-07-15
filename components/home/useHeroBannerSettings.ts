// ==================================================
// SECTION: HERO
// РАЗДЕЛ: Настройки умного баннера (реальные, из БД)
// ==================================================
"use client";

import { useEffect, useState } from "react";

export type HeroBannerSettings = {
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  isEnabled: boolean;
};

export function useHeroBannerSettings(): HeroBannerSettings | null {
  const [settings, setSettings] = useState<HeroBannerSettings | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/hero-banner", { cache: "no-store" })
      .then((response) => response.json())
      .then((body: { settings?: HeroBannerSettings | null }) => {
        if (!active) {
          return;
        }
        if (body.settings && body.settings.isEnabled) {
          setSettings(body.settings);
        }
      })
      .catch(() => {
        // Storefront falls back to the static hero content.
      });

    return () => {
      active = false;
    };
  }, []);

  return settings;
}
