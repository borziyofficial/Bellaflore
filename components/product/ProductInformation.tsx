// ==================================================
// SECTION: PRODUCT
// РАЗДЕЛ: Открытая информация о товаре
// ==================================================
import { ProductDeliveryPreview } from "@/components/product/ProductDeliveryPreview";
import type { ProductExperienceData } from "@/components/product/productExperienceTypes";
import type { RealDeliveryZoneResult } from "@/components/deliveryZones/realDeliveryZoneTypes";
import styles from "@/components/product/ProductInformation.module.css";

type ProductInformationProps = {
  data: ProductExperienceData;
  deliveryAddress: string;
  zoneResult: RealDeliveryZoneResult;
  deliveryDate: string;
  deliveryTime: string;
  nearestFromConfidence: string | null;
  checkoutNow: Date;
};

export function ProductInformation({
  data,
  deliveryAddress,
  zoneResult,
  deliveryDate,
  deliveryTime,
  nearestFromConfidence,
  checkoutNow,
}: ProductInformationProps) {
  return (
    <div className={styles.information} aria-label="Информация о букете">
      <dl className={styles.list}>
        <div className={styles.row}>
          <dt>Состав</dt>
          <dd>{data.composition}</dd>
        </div>

        <div className={styles.row}>
          <dt>Уход</dt>
          <dd>{data.careNote}</dd>
        </div>

        <div className={styles.row}>
          <dt>В заказе</dt>
          <dd>
            <p>{data.whatsIncluded}</p>
            <p className={styles.guarantee}>{data.freshnessGuarantee}</p>
          </dd>
        </div>

        <div className={styles.row}>
          <dt>Доставка</dt>
          <dd>
            <p>{data.deliveryNote}</p>
            <ProductDeliveryPreview
              deliveryAddress={deliveryAddress}
              zoneResult={zoneResult}
              deliveryDate={deliveryDate}
              deliveryTime={deliveryTime}
              nearestFromConfidence={nearestFromConfidence}
              now={checkoutNow}
            />
          </dd>
        </div>
      </dl>
    </div>
  );
}
