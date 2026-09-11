// ==================================================
// SECTION: ADMIN — Smart banner (hero management)
// ==================================================

import { AdminAppPage, AdminSmartBannerModule } from "@/components/adminApp";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/adminApiAuth";
import { getHeroBannerSettings } from "@/lib/heroBannerDb";
import { getPromoBannerSnapshot } from "@/lib/promoBannerDb";

export default async function AdminSmartBannerPage() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  const isAuthorized = Boolean(token && verifyAdminSessionToken(token));
  const [initialSnapshot, initialHeroSettings] = isAuthorized
    ? await Promise.all([
        getPromoBannerSnapshot().catch(() => null),
        getHeroBannerSettings().catch(() => null),
      ])
    : [null, null];

  return (
    <AdminAppPage route="/admin" title="Умный баннер">
      <AdminSmartBannerModule
        initialSnapshot={initialSnapshot}
        initialHeroSettings={initialHeroSettings}
      />
    </AdminAppPage>
  );
}
