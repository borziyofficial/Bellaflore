// ==================================================
// SECTION: PRODUCT
// РАЗДЕЛ: Product Experience Page
//
// Purpose (EN): Premium product detail overlay — gallery, sizes, buy, trust, related.
//
// Назначение (RU): Премиальная страница товара — галерея, размеры, покупка, доверие.
// ==================================================
"use client";

import { useCallback, useMemo, useState } from "react";
import { ProductInformation } from "@/components/product/ProductInformation";
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
  onBuy: (
    productId: string,
    sizeId: ProductSizeId,
    priceRub: number,
    quantity?: number,
  ) => void;
  onToggleFavorite: (productId: string) => void;
  onProductSelect: (productId: string) => void;
  onImageError: (imageId: string) => void;
};

const PRODUCT_SIZE_IDS: ProductSizeId[] = ["S", "M", "L", "XL"];
const COLLAPSIBLE_DESCRIPTION_LENGTH = 180;

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
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = getProductSizeVariant(experienceData, selectedSizeId);
  const selectedSizeLabel = selectedVariant.sizeId;
  const priceLabel = formatPrice(selectedVariant.priceRub);
  const descriptionIsLong =
    experienceData.description.length > COLLAPSIBLE_DESCRIPTION_LENGTH;

  const handleBuy = () => {
    onBuy(product.id, selectedSizeId, selectedVariant.priceRub, quantity);
  };
  const handleFavoriteToggle = useCallback(
    () => onToggleFavorite(product.id),
    [onToggleFavorite, product.id],
  );
  const handleSizeSelect = useCallback((sizeId: ProductSizeId) => {
    setSelectedSizeId(sizeId);
  }, []);
  const closeSizeSheet = useCallback(() => setSizeSheetOpen(false), []);
  const handleShare = useCallback(async () => {
    const shareUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.title, url: shareUrl });
        return;
      }
      await navigator.clipboard?.writeText(shareUrl);
    } catch {
      // Closing the native share sheet is an expected user action.
    }
  }, [product.title]);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={product.title}>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <button type="button" className={styles.backButton} onClick={onClose}>
            ← Назад
          </button>
          <div className={styles.topActions}>
            <button
              type="button"
              className={`${styles.iconAction} ${isFavorite ? styles.iconActionActive : ""}`}
              onClick={handleFavoriteToggle}
              aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
              aria-pressed={isFavorite}
            >
              <span aria-hidden="true">♡</span>
            </button>
            <button
              type="button"
              className={styles.iconAction}
              onClick={() => void handleShare()}
              aria-label="Поделиться букетом"
            >
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>

        <div className={styles.content}>
          <ProductGallery
            images={experienceData.galleryImages}
            productTitle={product.title}
            failedImageIds={failedImageIds}
            onImageError={onImageError}
          />

          <div className={styles.heroCopy}>
            {experienceData.badge ? (
              <span className={styles.badge}>{experienceData.badge}</span>
            ) : null}
            {product.category ? (
              <span className={styles.category}>{product.category}</span>
            ) : null}
            <h1 className={styles.title}>{product.title}</h1>
            <p
              id="product-description"
              className={`${styles.lead} ${
                descriptionIsLong && !descriptionExpanded
                  ? styles.leadCollapsed
                  : ""
              }`}
            >
              {experienceData.description}
            </p>
            {descriptionIsLong ? (
              <button
                type="button"
                className={styles.readMore}
                aria-expanded={descriptionExpanded}
                aria-controls="product-description"
                onClick={() => setDescriptionExpanded((current) => !current)}
              >
                {descriptionExpanded ? "Скрыть" : "Показать ещё"}
              </button>
            ) : null}
            <div className={styles.priceRow}>
              <strong className={styles.price}>{priceLabel}</strong>
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
            <span>Размер: {selectedVariant.sizeId}</span>
            <strong>{priceLabel}</strong>
            <span aria-hidden="true">▼</span>
          </button>

          <div className={styles.quantityRow} aria-label="Количество букетов">
            <span>Количество</span>
            <div className={styles.quantityStepper}>
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                aria-label="Уменьшить количество"
                disabled={quantity === 1}
              >
                −
              </button>
              <output aria-live="polite">{quantity}</output>
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.min(9, current + 1))}
                aria-label="Увеличить количество"
                disabled={quantity === 9}
              >
                +
              </button>
            </div>
          </div>

          <ProductBuyPanel
            sizeLabel={selectedSizeLabel}
            priceLabel={priceLabel}
            deliveryNote={experienceData.deliveryNote}
            isFavorite={isFavorite}
            onBuy={handleBuy}
            onToggleFavorite={handleFavoriteToggle}
          />

          <ProductTrustStrip />

          <div className={styles.sectionBlock}>
            <h2 className={styles.sectionTitle}>О букете</h2>
            <ProductInformation
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
        onToggleFavorite={handleFavoriteToggle}
        onBuy={handleBuy}
      />

      <ProductSizePickerSheet
        open={sizeSheetOpen}
        title="Размер"
        productName={product.title}
        variants={experienceData.sizeVariants}
        selectedSizeId={selectedSizeId}
        formatPrice={formatPrice}
        visibleSizeIds={PRODUCT_SIZE_IDS}
        onSelect={handleSizeSelect}
        onClose={closeSizeSheet}
      />
    </div>
  );
}
