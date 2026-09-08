// ==================================================
// SECTION: ADMIN — Delivery zones
// РАЗДЕЛ: Админ — Зоны доставки
// ==================================================

import { AdminAppPage, AdminDeliveryZonesModule } from "@/components/adminApp";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/adminApiAuth";
import { getDeliveryZonesForAdmin } from "@/lib/deliveryZonesDb";

export default async function AdminDeliveryZonesPage() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  const initialZones =
    token && verifyAdminSessionToken(token)
      ? await getDeliveryZonesForAdmin().catch(() => null)
      : null;

  return (
    <AdminAppPage route="/admin" title="Зоны доставки">
      <AdminDeliveryZonesModule initialZones={initialZones} />
    </AdminAppPage>
  );
}
