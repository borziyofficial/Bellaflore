// ==================================================
// SECTION: DELIVERY ZONE MAP MODAL
// РАЗДЕЛ: Развернутая карта доставки
//
// Purpose (EN):
// Full-screen (mobile) / large (desktop) BellaFlore-owned modal around the
// embedded Yandex delivery map. Supports two entry paths: refining an
// address that text search already resolved, and picking a point on the map
// before any address exists. Nothing leaves for yandex.ru/maps.
//
// Назначение (RU):
// Модальное окно BellaFlore с встроенной картой Yandex: полноэкранное на
// мобильном, большое на десктопе. Поддерживает уточнение найденного адреса
// и выбор точки на карте без предварительного поиска.
// ==================================================
"use client";

import {
  DeliveryZoneMap,
  type MapPointSelection,
} from "@/components/deliveryZones/DeliveryZoneMap";
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";
import type { DeliveryZoneMapMarker } from "@/components/deliveryZones/deliveryZoneMapTypes";
import type { RealDeliveryZoneStatus } from "@/components/deliveryZones/realDeliveryZoneTypes";
import styles from "@/components/deliveryZones/DeliveryZoneMapModal.module.css";
import { useEffect } from "react";

type DeliveryZoneMapModalProps = {
  isOpen: boolean;
  selectedZoneId: DeliveryZoneId | null;
  zoneStatus?: RealDeliveryZoneStatus;
  marker?: DeliveryZoneMapMarker | null;
  currentAddress?: string;
  currentZoneLabel?: string | null;
  currentPrice?: number | null;
  zoneUnavailable?: boolean;
  formatPrice: (priceRub: number) => string;
  onMapPointSelect?: (point: MapPointSelection) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeliveryZoneMapModal({
  isOpen,
  selectedZoneId,
  zoneStatus,
  marker,
  currentAddress,
  currentZoneLabel,
  currentPrice,
  zoneUnavailable,
  formatPrice,
  onMapPointSelect,
  onConfirm,
  onCancel,
}: DeliveryZoneMapModalProps) {
  // Body scroll lock. The original inline value is captured and restored by
  // the cleanup, which also runs on unmount — so the page can never be left
  // stuck with overflow:hidden the way the old Favorites overlay did.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Escape cancels — it must behave exactly like the close button, i.e.
  // discard the in-modal selection rather than silently committing it.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  const trimmedAddress = currentAddress?.trim() ?? "";
  const hasSelection = Boolean(marker) && trimmedAddress.length > 0;

  return (
    <div
      className={styles.modalBackdrop}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Выбор точки доставки на карте"
    >
      <div
        className={styles.modalContent}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            <h2 className={styles.modalTitle}>Точка доставки</h2>
            <p className={styles.modalHint}>
              Нажмите на карту, чтобы выбрать или уточнить точку
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onCancel}
            aria-label="Закрыть карту без изменений"
          >
            <span className={styles.closeIcon} aria-hidden="true">
              ✕
            </span>
          </button>
        </div>

        <div className={styles.mapContainer}>
          <DeliveryZoneMap
            variant="checkoutExpanded"
            selectedZoneId={selectedZoneId}
            zoneStatus={zoneStatus}
            marker={marker ?? null}
            formatPrice={formatPrice}
            onMapPointSelect={onMapPointSelect}
          />
        </div>

        <div className={styles.modalSummary}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Адрес</span>
            <span
              className={
                trimmedAddress ? styles.summaryValue : styles.summaryValueMuted
              }
            >
              {trimmedAddress || "Точка не выбрана"}
            </span>
          </div>

          {currentZoneLabel ? (
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Зона</span>
              <span className={styles.summaryValue}>{currentZoneLabel}</span>
            </div>
          ) : null}

          {typeof currentPrice === "number" ? (
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Доставка</span>
              <span className={styles.summaryValue}>
                {formatPrice(currentPrice)}
              </span>
            </div>
          ) : null}

          {hasSelection && zoneUnavailable ? (
            <p className={styles.summaryWarning} role="status">
              Адрес вне зоны доставки. Выберите другую точку.
            </p>
          ) : null}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Отмена
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={onConfirm}
            disabled={!hasSelection}
          >
            Подтвердить адрес
          </button>
        </div>
      </div>
    </div>
  );
}
