// ==================================================
// SECTION: COURIER INTELLIGENCE
// РАЗДЕЛ: Типы
// ==================================================
export type CourierOperationalStatus = "available" | "busy" | "resting" | "offline";

export type CourierTimelineEventKind =
  | "assigned"
  | "accepted"
  | "departed"
  | "arrived"
  | "delivered"
  | "cancelled"
  | "reassigned"
  | "unassigned";

export type CourierActorType = "system" | "admin" | "courier" | "ai";

export type CourierWorkingHours = {
  startMinutes: number;
  endMinutes: number;
  timezone: string;
};

export type CourierGeoPosition = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
  capturedAt: string;
  source: "manual_mock" | "browser_geolocation" | "provider_api";
};

export type CourierProfile = {
  id: string;
  fullName: string;
  phone: string;
  status: CourierOperationalStatus;
  currentLocation: CourierGeoPosition | null;
  capacityOrders: number;
  activeOrderIds: string[];
  supportedZoneIds: string[];
  workingHours: CourierWorkingHours;
  isBlocked: boolean;
  priorityScore: number;
  metadata?: {
    vehicleType?: "car" | "bike" | "foot";
    notes?: string[];
  };
};

export type CourierTimelineEvent = {
  id: string;
  courierId: string;
  orderId?: string | null;
  kind: CourierTimelineEventKind;
  title: string;
  message: string;
  createdAt: string;
  actorType: CourierActorType;
  actorName?: string | null;
};

export type CourierAssignmentCandidate = {
  courier: CourierProfile;
  score: number;
  distanceKm: number | null;
  currentLoad: number;
  reasons: string[];
};

export type CourierAutoAssignmentResult = {
  orderId: string;
  recommendedCourier: CourierAssignmentCandidate | null;
  candidates: CourierAssignmentCandidate[];
  generatedAt: string;
};

export type CourierRouteStop = {
  stopId: string;
  orderId: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  sequence: number;
  etaMinutes?: number | null;
};

export type CourierRoutePlan = {
  routeId: string;
  courierId: string;
  stops: CourierRouteStop[];
  totalDistanceKm: number | null;
  totalEtaMinutes: number | null;
  optimized: boolean;
  createdAt: string;
};

export type CourierAdminOverride = {
  blockedCourierIds: string[];
  profileOverrides: Partial<
    Record<
      string,
      Partial<
        Pick<
          CourierProfile,
          | "status"
          | "capacityOrders"
          | "supportedZoneIds"
          | "workingHours"
          | "isBlocked"
          | "priorityScore"
        >
      > & {
        currentLocation?: CourierGeoPosition | null;
      }
    >
  >;
  rulesVersion: string;
  updatedAt: string;
};

export type CourierStatsSnapshot = {
  courierId: string;
  fullName: string;
  deliveredCount: number;
  activeCount: number;
  cancelledCount: number;
  averageEtaMinutes: number | null;
  onTimeRate: number | null;
};

export type CourierAssignmentPriority = "low" | "normal" | "high" | "urgent";

export type CourierAssignmentRequest = {
  orderId: string;
  deliveryAddress: string;
  latitude?: number | null;
  longitude?: number | null;
  zoneId?: string | null;
  deliveryDate: string;
  deliveryInterval: string;
  priority?: CourierAssignmentPriority;
};

export type AiCourierIntelligenceHooks = {
  suggestBestCourier?: (
    request: CourierAssignmentRequest,
  ) => Promise<CourierAssignmentCandidate | null>;
  predictCourierDelay?: (
    courierId: string,
    orderId: string,
  ) => Promise<{ delayMinutes: number; reason: string } | null>;
  detectCourierOverload?: (
    courierId: string,
  ) => Promise<{ overloaded: boolean; reasons: string[] }>;
  recommendOrderRebalancing?: () => Promise<
    Array<{ orderId: string; fromCourierId: string; toCourierId: string; reason: string }>
  >;
};

export type ManualCourierAssignmentResult = {
  ok: boolean;
  courierId: string;
  orderId: string;
  message: string;
  timelineEvent?: CourierTimelineEvent;
};
