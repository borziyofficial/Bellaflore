"use client";

import { useEffect, useState } from "react";

export type ProductRatingSummary = {
  average: number;
  count: number;
};

const EMPTY_SUMMARY: ProductRatingSummary = { average: 0, count: 0 };

export function useProductRatings(productId: string) {
  const [summary, setSummary] = useState<ProductRatingSummary>(EMPTY_SUMMARY);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(
          `/api/reviews/summary?productId=${encodeURIComponent(productId)}`,
          { cache: "no-store" },
        );
        if (!response.ok) return;

        const payload = (await response.json()) as Partial<ProductRatingSummary>;
        if (!cancelled) {
          const average = Number(payload.average ?? 0);
          const count = Number(payload.count ?? 0);
          setSummary({
            average: Number.isFinite(average) ? average : 0,
            count: Number.isFinite(count) ? count : 0,
          });
        }
      } catch {
        // Rating is supplemental; keep the catalog usable if the endpoint is unavailable.
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  return summary;
}
