import type { Metadata } from "next";
import { AdminAppPage } from "@/components/adminApp";
import { AdminReviewsPanel } from "@/components/admin/AdminReviewsPanel";

export const metadata: Metadata = {
  title: "Отзывы — BellaFlore Admin",
  description: "Модерация отзывов BellaFlore",
};

export default function AdminReviewsPage() {
  return (
    <AdminAppPage route="/admin/reviews" title="Отзывы">
      <AdminReviewsPanel />
    </AdminAppPage>
  );
}
