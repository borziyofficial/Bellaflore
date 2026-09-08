"use client";

import { useParams } from "next/navigation";
import { AdminAppPage } from "@/components/adminApp";
import { AdminOrderDetailsModule } from "@/components/adminApp/modules/orders/AdminOrderDetailsModule";

export default function AdminOrderDetailsPage() {
  const params = useParams<{ id: string }>();

  return (
    <AdminAppPage route="/admin" title="Детали заказа">
      <AdminOrderDetailsModule orderId={params.id} />
    </AdminAppPage>
  );
}
