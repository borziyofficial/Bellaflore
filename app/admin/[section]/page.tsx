// ==================================================
// SECTION: Admin — Dynamic future module page
// ==================================================
"use client";

import { useParams } from "next/navigation";
import {
  AdminAppPage,
  getAdminFutureModule,
} from "@/components/adminApp";
import {
  AdminAnalyticsModule,
  AdminAutomationModule,
  AdminCategoriesModule,
  AdminCustomersModule,
  AdminNotificationsModule,
  AdminPromotionsModule,
  AdminSettingsModule,
} from "@/components/adminApp/modules/operations/AdminOperationsModules";
import ui from "@/components/adminApp/shared/AdminModuleUi.module.css";

const MODULES = {
  categories: AdminCategoriesModule,
  customers: AdminCustomersModule,
  promotions: AdminPromotionsModule,
  analytics: AdminAnalyticsModule,
  notifications: AdminNotificationsModule,
  automation: AdminAutomationModule,
  settings: AdminSettingsModule,
} as const;

export default function AdminFutureSectionPage() {
  const params = useParams<{ section: string }>();
  const sectionSlug = typeof params.section === "string" ? params.section : "";
  const moduleConfig = getAdminFutureModule(sectionSlug);
  const Module = MODULES[sectionSlug as keyof typeof MODULES];

  if (!moduleConfig || !Module) {
    return (
      <AdminAppPage route="/admin" title="Не найдено">
        <div className={ui.emptyZone}>Раздел «{sectionSlug}» не зарегистрирован.</div>
      </AdminAppPage>
    );
  }

  return (
    <AdminAppPage route="/admin" title={moduleConfig.title}>
      <Module />
    </AdminAppPage>
  );
}
