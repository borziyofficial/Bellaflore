// ==================================================
// SECTION: HOME CATALOG
// РАЗДЕЛ: Пользовательские категории на витрине (реальные, из БД)
// ==================================================
"use client";

import { useEffect, useState } from "react";

export type StorefrontCategoryChip = { id: string; title: string };

export function useStorefrontCustomCategories(): StorefrontCategoryChip[] {
  const [categories, setCategories] = useState<StorefrontCategoryChip[]>([]);

  useEffect(() => {
    let active = true;

    fetch("/api/catalog/categories", { cache: "no-store" })
      .then((response) => response.json())
      .then((body: { categories?: Array<{ id: string; title: string; isCustom: boolean }> }) => {
        if (!active) {
          return;
        }
        const custom = (body.categories ?? [])
          .filter((category) => category.isCustom)
          .map((category) => ({ id: category.id, title: category.title }));
        setCategories(custom);
      })
      .catch(() => {
        // Storefront falls back to the static category chips.
      });

    return () => {
      active = false;
    };
  }, []);

  return categories;
}
