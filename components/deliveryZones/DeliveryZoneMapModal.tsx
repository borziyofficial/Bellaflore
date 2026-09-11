// ==================================================
// SECTION: DELIVERY ZONE MAP MODAL
// РАЗДЕЛ: Развернутая карта доставки
//
// Purpose (EN):
// Full-screen/large modal for expanded delivery zone map
//
// Назначение (RU):
// Модальное окно для развернутой карты доставки
// ==================================================
"use client";

import { DeliveryZoneMap, type MapPointSelection } from "@/components/deliveryZones/DeliveryZoneMap";
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
  formatPrice: (priceRub: number) => string;
  onMapPointSelect?: (point: MapPointSelection) => void;
  onConfirm?: () => void;
  onClose: () => void;
};

export function DeliveryZoneMapModal({
  isOpen,
  selectedZoneId,
  zoneStatus,
  marker,
  formatPrice,
  onMapPointSelect,
  onConfirm,
  onClose,
}: DeliveryZoneMapModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleMapPointSelect = (point: MapPointSelection) => {
    onMapPointSelect?.(point);
  };

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Уточнить точку доставки</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Закрыть карту"
          >
            <span className={styles.closeIcon}>✕</span>
          </button>
        </div>

        {/* Map container */}
        <div className={styles.mapContainer}>
          <DeliveryZoneMap
            variant="checkout"
            selectedZoneId={selectedZoneId}
            zoneStatus={zoneStatus}
            marker={marker}
            formatPrice={formatPrice}
            onMapPointSelect={handleMapPointSelect}
          />
        </div>

        {/* Footer with action button */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={handleConfirm}
          >
            Подтвердить адрес
          </button>
        </div>
      </div>
    </div>
  );
}
