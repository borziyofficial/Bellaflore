// ==================================================
// SECTION: ADMIN APP — Bouquet categories hook (Stage 2.3.1)
// ==================================================
"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminBouquetCategory } from "@/components/adminApp/modules/bouquets/bouquetCategoryTypes";
import {
  addAdminBouquetCategory,
  readAdminBouquetCategories,
  renameAdminBouquetCategory,
} from "@/components/adminApp/modules/bouquets/bouquetCategoryStore";

export function useAdminBouquetCategories() {
  const [categories, setCategories] = useState<AdminBouquetCategory[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setCategories(readAdminBouquetCategories());
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();

    const onChange = () => refresh();
    window.addEventListener("admin-bouquet-categories-change", onChange);
    return () => window.removeEventListener("admin-bouquet-categories-change", onChange);
  }, [refresh]);

  const createCategory = useCallback(
    (name: string) => {
      try {
        const category = addAdminBouquetCategory(name);
        refresh();
        return category;
      } catch {
        return null;
      }
    },
    [refresh],
  );

  const updateCategoryName = useCallback(
    (categoryId: string, name: string) => {
      const category = renameAdminBouquetCategory(categoryId, name);
      refresh();
      return category;
    },
    [refresh],
  );

  return {
    categories,
    ready,
    refresh,
    createCategory,
    updateCategoryName,
  };
}
