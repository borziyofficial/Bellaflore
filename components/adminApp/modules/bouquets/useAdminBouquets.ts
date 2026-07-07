// ==================================================
// SECTION: ADMIN APP — Bouquet state hook (Stage 2.5)
// ==================================================
"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  BouquetDraft,
  BouquetRecord,
  BouquetStatus,
} from "@/components/adminApp/modules/bouquets/bouquetTypes";
import {
  bulkDeleteAdminBouquets,
  bulkSetAdminBouquetStatus,
  deleteAdminBouquet,
  duplicateAdminBouquet,
  hideAdminBouquet,
  readAdminBouquets,
  setAdminBouquetStatus,
  upsertAdminBouquet,
  writeAdminBouquets,
} from "@/components/adminApp/modules/bouquets/bouquetStore";

export function useAdminBouquets() {
  const [bouquets, setBouquets] = useState<BouquetRecord[]>(() =>
    typeof window !== "undefined" ? readAdminBouquets() : [],
  );
  const [ready, setReady] = useState(() => typeof window !== "undefined");

  useEffect(() => {
    setBouquets(readAdminBouquets());
    setReady(true);
  }, []);

  const persist = useCallback((next: BouquetRecord[]) => {
    setBouquets(next);
    writeAdminBouquets(next);
  }, []);

  const saveBouquet = useCallback(
    (draft: BouquetDraft, id?: string) => {
      const next = upsertAdminBouquet(bouquets, draft, id);
      persist(next);
      return next.find((item) =>
        id ? item.id === id : item.name === draft.name.trim(),
      );
    },
    [bouquets, persist],
  );

  const duplicateBouquet = useCallback(
    (id: string) => {
      persist(duplicateAdminBouquet(bouquets, id));
    },
    [bouquets, persist],
  );

  const hideBouquet = useCallback(
    (id: string) => {
      persist(hideAdminBouquet(bouquets, id));
    },
    [bouquets, persist],
  );

  const activateBouquet = useCallback(
    (id: string) => {
      persist(setAdminBouquetStatus(bouquets, id, "active"));
    },
    [bouquets, persist],
  );

  const setBouquetStatus = useCallback(
    (id: string, status: BouquetStatus) => {
      persist(setAdminBouquetStatus(bouquets, id, status));
    },
    [bouquets, persist],
  );

  const bulkSetStatus = useCallback(
    (ids: string[], status: BouquetStatus) => {
      persist(bulkSetAdminBouquetStatus(bouquets, ids, status));
    },
    [bouquets, persist],
  );

  const removeBouquet = useCallback(
    (id: string) => {
      persist(deleteAdminBouquet(bouquets, id));
    },
    [bouquets, persist],
  );

  const bulkRemoveBouquets = useCallback(
    (ids: string[]) => {
      persist(bulkDeleteAdminBouquets(bouquets, ids));
    },
    [bouquets, persist],
  );

  return {
    bouquets,
    ready,
    saveBouquet,
    duplicateBouquet,
    hideBouquet,
    activateBouquet,
    setBouquetStatus,
    bulkSetStatus,
    removeBouquet,
    bulkRemoveBouquets,
  };
}
