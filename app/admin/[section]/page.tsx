// ==================================================
// SECTION: Admin — Dynamic future module page
// ==================================================
"use client";

import { useParams } from "next/navigation";
import {
  AdminAppPage,
  AdminFutureModule,
  getAdminFutureModule,
} from "@/components/adminApp";
import ui from "@/components/adminApp/shared/AdminModuleUi.module.css";

export default function AdminFutureSectionPage() {
  const params = useParams<{ section: string }>();
  const sectionSlug = typeof params.section === "string" ? params.section : "";
  const moduleConfig = getAdminFutureModule(sectionSlug);

  if (!moduleConfig) {
    return (
      <AdminAppPage route="/admin" title="Not found">
        <div className={ui.emptyZone}>Module &quot;{sectionSlug}&quot; is not registered.</div>
      </AdminAppPage>
    );
  }

  return (
    <AdminAppPage route="/admin" title={moduleConfig.title}>
      <AdminFutureModule
        title={moduleConfig.title}
        subtitle={moduleConfig.subtitle}
        bullets={moduleConfig.bullets}
      />
    </AdminAppPage>
  );
}
