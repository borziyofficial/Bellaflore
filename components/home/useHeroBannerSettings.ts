// ==================================================
// SECTION: HERO
// РАЗДЕЛ: Настройки умного баннера (реальные, из БД)
// ==================================================
"use client";

import { useEffect, useState } from "react";

export type HeroBannerSettings = {
  imageUrl: string;
  photos?: HeroBannerPhoto[];
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  isEnabled: boolean;
};

export type HeroBannerPhoto = {
  id: string;
  imageUrl: string;
  isEnabled: boolean;
  isPrimary: boolean;
  sortOrder: number;
};

export type HeroBannerSettingsState = {
  settings: HeroBannerSettings | null;
  isResolved: boolean;
};

export function useHeroBannerSettings(): HeroBannerSettingsState {
  const [state, setState] = useState<HeroBannerSettingsState>({
    settings: null,
    isResolved: false,
  });

  useEffect(() => {
    let active = true;

    fetch("/api/hero-banner", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Hero banner request failed");
        }
        return response.json();
      })
      .then((body: { settings?: HeroBannerSettings | null }) => {
        if (!active) {
          return;
        }
        setState({
          settings: body.settings?.isEnabled ? body.settings : null,
          isResolved: true,
        });
      })
      .catch(() => {
        if (active) {
          // Resolve before showing the static fallback, so it never flashes
          // while real storefront settings are still loading.
          setState({ settings: null, isResolved: true });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
