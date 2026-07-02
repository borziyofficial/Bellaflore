// ==================================================
// SECTION: PRODUCT
// РАЗДЕЛ: Product Experience Page
//
// Purpose (EN): Premium product detail overlay — gallery, sizes, buy, trust, related.
//
// Назначение (RU): Премиальная страница товара — галерея, размеры, покупка, доверие.
// ==================================================
"use client";

import { useMemo, useState } from "react";
import { ProductAccordions } from "@/components/product/ProductAccordions";
import { ProductBuyPanel } from "@/components/product/ProductBuyPanel";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductRecommendations } from "@/components/product/ProductRecommendations";
import {
  getProductExperienceData,
  getProductSizeVariant,
  getSimilarProducts,
} from "@/components/product/productExperienceCatalog";
import styles from "@/components/product/ProductExperiencePage.module.css";
import { ProductSizePickerSheet } from "@/components/product/ProductSizePickerSheet";
import { ProductStickyBuyBar } from "@/components/product/ProductStickyBuyBar";
import { ProductTrustStrip } from "@/components/product/ProductTrustStrip";
import { getProductSizeRuLabel } from "@/lib/product/sizeLabels";
import type {
  CatalogProductBase,
  ProductSizeId,
} from "@/components/product/productExperienceTypes";
import type { RealDeliveryZoneResult } from "@/components/deliveryZones/realDeliveryZoneTypes";

type ProductExperiencePageProps = {
  product: CatalogProductBase;
  allProducts: CatalogProductBase[];
  formatPrice: (priceRub: number) => string;
  isFavorite: boolean;
  failedImageIds: Set<string>;
  deliveryAddress: string;
  zoneResult: RealDeliveryZoneResult;
  deliveryDate: string;
  deliveryTime: string;
  nearestFromConfidence: string | null;
  checkoutNow: Date;
  onClose: () => void;
  onBuy: (productId: string, sizeId: ProductSizeId, priceRub: number) => void;
  onToggleFavorite: (productId: string) => void;
  onProductSelect: (productId: string) => void;
  onImageError: (imageId: string) => void;
};

export function ProductExperiencePage({
  product,
  allProducts,
  formatPrice,
  isFavorite,
  failedImageIds,
  deliveryAddress,
  zoneResult,
  deliveryDate,
  deliveryTime,
  nearestFromConfidence,
  checkoutNow,
  onClose,
  onBuy,
  onToggleFavorite,
  onProductSelect,
  onImageError,
}: ProductExperiencePageProps) {
  const experienceData = useMemo(
    () => getProductExperienceData(product),
    [product],
  );
  const similarProducts = useMemo(
    () => getSimilarProducts(product.id, allProducts, 8),
    [allProducts, product.id],
  );
  const [selectedSizeId, setSelectedSizeId] = useState<ProductSizeId>(
    experienceData.sizeVariants.some((variant) => variant.sizeId === "M")
      ? "M"
      : experienceData.defaultSizeId,
  );
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false);

  const selectedVariant = getProductSizeVariant(experienceData, selectedSizeId);
  const selectedSizeLabel = getProductSizeRuLabel(selectedVariant.sizeId);
  const priceLabel = formatPrice(selectedVariant.priceRub);

  const handleBuy = () => {
    onBuy(product.id, selectedSizeId, selectedVariant.priceRub);
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={product.title}>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <button type="button" className={styles.backButton} onClick={onClose}>
            ← Назад
          </button>
          {experienceData.badge ? (
            <span className={styles.badge}>{experienceData.badge}</span>
          ) : null}
        </div>

        <div className={styles.content}>
          <ProductGallery
            images={experienceData.galleryImages}
            productTitle={product.title}
            failedImageIds={failedImageIds}
            onImageError={onImageError}
          />

          <div className={styles.heroCopy}>
            {product.category ? (
              <span className={styles.category}>{product.category}</span>
            ) : null}
            <h1 className={styles.title}>{product.title}</h1>
            <p className={styles.lead}>{experienceData.description}</p>
            <div className={styles.priceRow}>
              <strong className={styles.price}>{priceLabel}</strong>
              <span className={styles.sizeHint}>Размер {selectedSizeLabel}</span>
            </div>
            {selectedVariant.stemCount ? (
              <p className={styles.stemHint}>{selectedVariant.stemCount} стеблей</p>
            ) : null}
          </div>

          <button
            type="button"
            className={styles.sizePickerButton}
            onClick={() => setSizeSheetOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={sizeSheetOpen}
          >
            <span>Размер: {selectedSizeLabel}</span>
            <strong>{priceLabel}</strong>
            <span aria-hidden="true">▼</span>
          </button>

          <ProductBuyPanel
            sizeLabel={selectedSizeLabel}
            priceLabel={priceLabel}
            deliveryNote={experienceData.deliveryNote}
            isFavorite={isFavorite}
            onBuy={handleBuy}
            onToggleFavorite={() => onToggleFavorite(product.id)}
          />

          <ProductTrustStrip />

          <div className={styles.sectionBlock}>
            <h2 className={styles.sectionTitle}>О букете</h2>
            <ProductAccordions
              data={experienceData}
              deliveryAddress={deliveryAddress}
              zoneResult={zoneResult}
              deliveryDate={deliveryDate}
              deliveryTime={deliveryTime}
              nearestFromConfidence={nearestFromConfidence}
              checkoutNow={checkoutNow}
            />
          </div>

          <ProductRecommendations
            products={similarProducts}
            formatPrice={formatPrice}
            failedImageIds={failedImageIds}
            onProductSelect={onProductSelect}
            onImageError={onImageError}
          />
        </div>
      </div>

      <ProductStickyBuyBar
        sizeLabel={selectedSizeLabel}
        priceLabel={priceLabel}
        deliveryNote={experienceData.deliveryNote}
        isFavorite={isFavorite}
        onToggleFavorite={() => onToggleFavorite(product.id)}
        onBuy={handleBuy}
      />

      <ProductSizePickerSheet
        open={sizeSheetOpen}
        title="Размер"
        variants={experienceData.sizeVariants}
        selectedSizeId={selectedSizeId}
        formatPrice={formatPrice}
        visibleSizeIds={["S", "M", "L", "XL"]}
        onSelect={setSelectedSizeId}
        onClose={() => setSizeSheetOpen(false)}
      />
    </div>
  );
}
