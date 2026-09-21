// ==================================================
// SECTION: Homepage content blocks — client hook
// РАЗДЕЛ: Управляемые блоки главной страницы — клиентский хук
// ==================================================
"use client";

import { useEffect, useState } from "react";
import type { HomepageBlock, HomepageBlockKind } from "@/lib/homepageBlocksTypes";

export type HomepageBlocksState = {
  blocks: Partial<Record<HomepageBlockKind, HomepageBlock>> | null;
  isResolved: boolean;
};

export function useHomepageBlocks(): HomepageBlocksState {
  const [state, setState] = useState<HomepageBlocksState>({
    blocks: null,
    isResolved: false,
  });

  useEffect(() => {
    let active = true;

    fetch("/api/homepage-blocks", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Homepage blocks request failed");
        }
        return response.json();
      })
      .then((body: { blocks?: Partial<Record<HomepageBlockKind, HomepageBlock>> | null }) => {
        if (!active) {
          return;
        }
        setState({ blocks: body.blocks ?? null, isResolved: true });
      })
      .catch(() => {
        if (active) {
          setState({ blocks: null, isResolved: true });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}

export function getEnabledCards(block: HomepageBlock | undefined | null) {
  if (!block) {
    return [];
  }
  return block.cards.filter((card) => card.isEnabled).sort((a, b) => a.sortOrder - b.sortOrder);
}
