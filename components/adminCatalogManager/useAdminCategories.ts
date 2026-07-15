// ==================================================
// SECTION: Admin Catalog Manager — categories hook
// РАЗДЕЛ: Хук категорий каталога (server persistence)
// ==================================================
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ADMIN_CATEGORIES_CHANGE_EVENT,
  AdminCategoryApiError,
  createAdminCategoryRemote,
  deleteAdminCategoryRemote,
  fetchAdminCategories,
  getAdminProductCategories,
  renameAdminCategoryRemote,
  type AdminCategoryRecord,
} from "@/components/adminCatalogManager/adminCustomCategories";

export function useAdminCategories() {
  const [categories, setCategories] = useState<AdminCategoryRecord[]>(
    getAdminProductCategories(),
  );
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await fetchAdminCategories();
      setCategories(list);
      setError(null);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Не удалось загрузить категории.",
      );
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    let active = true;

    fetchAdminCategories()
      .then((list) => {
        if (!active) return;
        setCategories(list);
        setError(null);
      })
      .catch((fetchError: unknown) => {
        if (!active) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Не удалось загрузить категории.",
        );
      })
      .finally(() => {
        if (active) setReady(true);
      });

    const onChange = () => setCategories(getAdminProductCategories());
    window.addEventListener(ADMIN_CATEGORIES_CHANGE_EVENT, onChange);
    return () => {
      active = false;
      window.removeEventListener(ADMIN_CATEGORIES_CHANGE_EVENT, onChange);
    };
  }, []);

  const createCategory = useCallback(async (title: string) => {
    const created = await createAdminCategoryRemote(title);
    setCategories(getAdminProductCategories());
    return created;
  }, []);

  const renameCategory = useCallback(async (id: string, title: string) => {
    const updated = await renameAdminCategoryRemote(id, title);
    setCategories(getAdminProductCategories());
    return updated;
  }, []);

  const deleteCategory = useCallback(async (id: string, reassignTo?: string) => {
    const result = await deleteAdminCategoryRemote(id, reassignTo);
    setCategories(getAdminProductCategories());
    return result;
  }, []);

  return {
    categories,
    ready,
    error,
    refresh,
    createCategory,
    renameCategory,
    deleteCategory,
  };
}

export { AdminCategoryApiError };
export type { AdminCategoryRecord };
