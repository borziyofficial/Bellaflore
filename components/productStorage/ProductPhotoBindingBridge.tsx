// ==================================================
// SECTION: PRODUCT STORAGE
// РАЗДЕЛ: Photo Manager ↔ active product sync
// ==================================================
"use client";

import { useEffect, useRef } from "react";
import { usePhotoManager } from "@/components/photoManager/PhotoManagerProvider";
import { storedImageToPhotoUpload } from "@/components/productStorage/productStorageBridge";
import { useProductStorage } from "@/components/productStorage/ProductStorageProvider";

export function ProductPhotoBindingBridge() {
  const { activeProductId, activeProduct } = useProductStorage();
  const { replacePhotos } = usePhotoManager();
  const lastLoadedProductIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeProductId || !activeProduct) {
      lastLoadedProductIdRef.current = null;
      replacePhotos([]);
      return;
    }

    if (lastLoadedProductIdRef.current === activeProductId) {
      return;
    }

    lastLoadedProductIdRef.current = activeProductId;
    replacePhotos(activeProduct.images.map(storedImageToPhotoUpload));
  }, [activeProductId, activeProduct, replacePhotos]);

  return null;
}
