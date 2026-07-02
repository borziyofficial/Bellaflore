// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админ-панель
//
// Purpose (EN):
// Smart reroute suggestions panel
//
// Назначение (RU):
// Панель предложений умного перенаправления
// ==================================================
"use client";

import { AssistedRouteActionsPanel } from "@/components/admin/AssistedRouteActionsPanel";
import type { SmartRerouteSuggestionsData } from "@/components/dispatch/smartRerouteTypes";
import type { CourierRouteLine } from "@/components/maps/routeLineTypes";

type SmartReroutePanelProps = {
  data: SmartRerouteSuggestionsData;
  routeLines: CourierRouteLine[];
  onAssistedRouteChange?: () => void;
};

export function SmartReroutePanel({
  data,
  routeLines,
  onAssistedRouteChange,
}: SmartReroutePanelProps) {
  return (
    <AssistedRouteActionsPanel
      data={data}
      routeLines={routeLines}
      onAssistedRouteChange={onAssistedRouteChange}
    />
  );
}
