// ==================================================
// SECTION: ADMIN APP — Bouquet state hook
// ==================================================
"use client";

import { useCallback, useEffect, useState } from "react";
import type { BouquetDraft, BouquetRecord } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import {
  deleteAdminBouquet,
  duplicateAdminBouquet,
  hideAdminBouquet,
  readAdminBouquets,
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

  const removeBouquet = useCallback(
    (id: string) => {
      persist(deleteAdminBouquet(bouquets, id));
    },
    [bouquets, persist],
  );

  return {
    bouquets,
    ready,
    saveBouquet,
    duplicateBouquet,
    hideBouquet,
    removeBouquet,
  };
}
