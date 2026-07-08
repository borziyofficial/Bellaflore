// ==================================================
// SECTION: ADMIN APP — Bouquet state hook (Stage 2.7)
// ==================================================
"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  BouquetDraft,
  BouquetRecord,
  BouquetStatus,
} from "@/components/adminApp/modules/bouquets/bouquetTypes";
import {
  bulkDeleteBouquets,
  bulkSetBouquetStatus,
  deleteBouquet,
  duplicateBouquet,
  getBouquetPersistenceMode,
  hideBouquet,
  initializeBouquetRepository,
  setBouquetStatus,
  upsertBouquet,
  writeBouquets,
} from "@/lib/bouquetRepository";

export function useAdminBouquets() {
  const [bouquets, setBouquets] = useState<BouquetRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [persistenceMode, setPersistenceMode] = useState<"api" | "local">("local");

  useEffect(() => {
    let active = true;

    initializeBouquetRepository()
      .then((records) => {
        if (!active) {
          return;
        }
        setBouquets(records);
        setPersistenceMode(getBouquetPersistenceMode());
        setReady(true);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((next: BouquetRecord[]) => {
    const saved = writeBouquets(next);
    setBouquets(saved);
  }, []);

  const saveBouquet = useCallback(
    (draft: BouquetDraft, id?: string) => {
      const next = upsertBouquet(bouquets, draft, id);
      setBouquets(next);
      return next.find((item) =>
        id ? item.id === id : item.name === draft.name.trim(),
      );
    },
    [bouquets],
  );

  const duplicateBouquetAction = useCallback(
    (id: string) => {
      persist(duplicateBouquet(bouquets, id));
    },
    [bouquets, persist],
  );

  const hideBouquetAction = useCallback(
    (id: string) => {
      persist(hideBouquet(bouquets, id));
    },
    [bouquets, persist],
  );

  const activateBouquet = useCallback(
    (id: string) => {
      persist(setBouquetStatus(bouquets, id, "active"));
    },
    [bouquets, persist],
  );

  const setBouquetStatusAction = useCallback(
    (id: string, status: BouquetStatus) => {
      persist(setBouquetStatus(bouquets, id, status));
    },
    [bouquets, persist],
  );

  const bulkSetStatus = useCallback(
    (ids: string[], status: BouquetStatus) => {
      persist(bulkSetBouquetStatus(bouquets, ids, status));
    },
    [bouquets, persist],
  );

  const removeBouquet = useCallback(
    (id: string) => {
      persist(deleteBouquet(bouquets, id));
    },
    [bouquets, persist],
  );

  const bulkRemoveBouquets = useCallback(
    (ids: string[]) => {
      persist(bulkDeleteBouquets(bouquets, ids));
    },
    [bouquets, persist],
  );

  return {
    bouquets,
    ready,
    persistenceMode,
    saveBouquet,
    duplicateBouquet: duplicateBouquetAction,
    hideBouquet: hideBouquetAction,
    activateBouquet,
    setBouquetStatus: setBouquetStatusAction,
    bulkSetStatus,
    removeBouquet,
    bulkRemoveBouquets,
  };
}
