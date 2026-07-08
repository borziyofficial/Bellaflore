// ==================================================
// SECTION: ADMIN APP — Bouquet categories hook (Stage 2.7)
// ==================================================
"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminBouquetCategory } from "@/components/adminApp/modules/bouquets/bouquetCategoryTypes";
import {
  addCategory,
  getBouquetPersistenceMode,
  initializeCategoryRepository,
  renameCategory,
} from "@/lib/bouquetRepository";

export function useAdminBouquetCategories() {
  const [categories, setCategories] = useState<AdminBouquetCategory[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    void initializeCategoryRepository().then((next) => {
      setCategories(next);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    refresh();

    const onChange = () => refresh();
    window.addEventListener("admin-bouquet-categories-change", onChange);
    return () => window.removeEventListener("admin-bouquet-categories-change", onChange);
  }, [refresh]);

  const createCategory = useCallback(
    (name: string) => {
      const category = addCategory(name);
      if (category) {
        refresh();
      }
      return category;
    },
    [refresh],
  );

  const updateCategoryName = useCallback(
    (categoryId: string, name: string) => {
      const category = renameCategory(categoryId, name);
      if (category) {
        refresh();
      }
      return category;
    },
    [refresh],
  );

  return {
    categories,
    ready,
    persistenceMode: getBouquetPersistenceMode(),
    refresh,
    createCategory,
    updateCategoryName,
  };
}
