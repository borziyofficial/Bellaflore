// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Checkout delivery zone map preview
// ==================================================
"use client";

import type { LiveAddressPreview } from "@/components/addressIntelligence/liveAddressPreviewTypes";
import {
  DeliveryZoneMap,
  type MapPointSelection,
} from "@/components/deliveryZones/DeliveryZoneMap";
import type { RealDeliveryZoneResult } from "@/components/deliveryZones/realDeliveryZoneTypes";

type DeliveryZonePreviewProps = {
  result: RealDeliveryZoneResult;
  formatPrice: (priceRub: number) => string;
  liveAddressPreview?: LiveAddressPreview | null;
  onMapPointSelect?: (point: MapPointSelection) => void;
};

export function DeliveryZonePreview({
  result,
  formatPrice,
  liveAddressPreview = null,
  onMapPointSelect,
}: DeliveryZonePreviewProps) {
  const activeZoneId = result.selectedZoneId;
  const zoneResultMarker =
    result.latitude !== null && result.longitude !== null
      ? {
          latitude: result.latitude,
          longitude: result.longitude,
          label: result.address,
        }
      : null;
  const livePreviewMarker =
    liveAddressPreview?.hasCoordinates &&
    liveAddressPreview.latitude !== null &&
    liveAddressPreview.longitude !== null
      ? {
          latitude: liveAddressPreview.latitude,
          longitude: liveAddressPreview.longitude,
          label: liveAddressPreview.selectedAddress,
        }
      : null;
  const addressMarker = zoneResultMarker ?? livePreviewMarker;

  return (
    <section
      className="delivery-zone-card checkout-field-wide delivery-zone-preview"
      aria-label="Зона доставки"
    >
      <DeliveryZoneMap
        formatPrice={formatPrice}
        marker={addressMarker}
        onMapPointSelect={onMapPointSelect}
        selectedZoneId={activeZoneId}
        variant="checkout"
        zoneStatus={result.status}
      />
    </section>
  );
}
