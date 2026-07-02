// ==================================================
// SECTION: PRODUCT
// РАЗДЕЛ: Аккордеоны товара
//
// Purpose (EN): Premium product detail sections for the product experience page.
//
// Назначение (RU): Премиальные секции деталей на странице товара.
// ==================================================
"use client";

import { useState } from "react";
import {
  BellafloreAccordion,
  BellafloreAccordionPanel,
  type BellafloreAccordionPanelId,
} from "@/components/ui/BellafloreAccordion";
import { ProductDeliveryPreview } from "@/components/product/ProductDeliveryPreview";
import type { ProductExperienceData } from "@/components/product/productExperienceTypes";
import type { RealDeliveryZoneResult } from "@/components/deliveryZones/realDeliveryZoneTypes";

type ProductAccordionsProps = {
  data: ProductExperienceData;
  deliveryAddress: string;
  zoneResult: RealDeliveryZoneResult;
  deliveryDate: string;
  deliveryTime: string;
  nearestFromConfidence: string | null;
  checkoutNow: Date;
};

export function ProductAccordions({
  data,
  deliveryAddress,
  zoneResult,
  deliveryDate,
  deliveryTime,
  nearestFromConfidence,
  checkoutNow,
}: ProductAccordionsProps) {
  const [openPanels, setOpenPanels] = useState<Set<BellafloreAccordionPanelId>>(
    () => new Set(["description"]),
  );

  const togglePanel = (panelId: BellafloreAccordionPanelId) => {
    setOpenPanels((current) => {
      const next = new Set(current);
      if (next.has(panelId)) {
        next.delete(panelId);
      } else {
        next.add(panelId);
      }
      return next;
    });
  };

  return (
    <BellafloreAccordion>
      <BellafloreAccordionPanel
        id="composition"
        title="Состав букета"
        summary="Свежие цветы и упаковка"
        openPanels={openPanels}
        onTogglePanel={togglePanel}
      >
        <p>{data.composition}</p>
      </BellafloreAccordionPanel>

      <BellafloreAccordionPanel
        id="description"
        title="Описание"
        summary={data.description}
        openPanels={openPanels}
        onTogglePanel={togglePanel}
      >
        <p>{data.description}</p>
      </BellafloreAccordionPanel>

      <BellafloreAccordionPanel
        id="care"
        title="Уход за цветами"
        summary="Как сохранить свежесть"
        openPanels={openPanels}
        onTogglePanel={togglePanel}
      >
        <p>{data.careNote}</p>
      </BellafloreAccordionPanel>

      <BellafloreAccordionPanel
        id="delivery"
        title="Доставка"
        summary="По Москве и области"
        openPanels={openPanels}
        onTogglePanel={togglePanel}
      >
        <p>{data.deliveryNote}</p>
        <ProductDeliveryPreview
          deliveryAddress={deliveryAddress}
          zoneResult={zoneResult}
          deliveryDate={deliveryDate}
          deliveryTime={deliveryTime}
          nearestFromConfidence={nearestFromConfidence}
          now={checkoutNow}
        />
      </BellafloreAccordionPanel>

      <BellafloreAccordionPanel
        id="included"
        title="Что входит в заказ"
        summary="Упаковка и сервис"
        openPanels={openPanels}
        onTogglePanel={togglePanel}
      >
        <p>{data.whatsIncluded}</p>
        <p>{data.freshnessGuarantee}</p>
      </BellafloreAccordionPanel>
    </BellafloreAccordion>
  );
}
