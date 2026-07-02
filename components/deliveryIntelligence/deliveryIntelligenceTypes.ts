// ==================================================
// SECTION: DELIVERY INTELLIGENCE
// РАЗДЕЛ: Типы
// ==================================================
export type DeliveryStatus =
  | "pending"
  | "scheduled"
  | "courier_assigned"
  | "preparing_pickup"
  | "picked_up"
  | "in_transit"
  | "near_recipient"
  | "delivered"
  | "failed"
  | "cancelled"
  | "rescheduled";

export type DeliveryPriority = "low" | "normal" | "high" | "urgent";

export type DeliveryTimelineEventKind =
  | "delivery_created"
  | "window_selected"
  | "courier_assigned"
  | "pickup_preparing"
  | "picked_up"
  | "in_transit"
  | "near_recipient"
  | "delivered"
  | "failed"
  | "rescheduled"
  | "cancelled";

export type DeliveryNotificationEventKind =
  | "delivery_created"
  | "delivery_courier_assigned"
  | "delivery_started"
  | "delivery_near_recipient"
  | "delivery_delivered"
  | "delivery_failed"
  | "delivery_delay_detected"
  | "delivery_rescheduled";

export type DeliveryCoordinates = {
  latitude: number;
  longitude: number;
};

export type DeliveryWindow = {
  id: string;
  label: string;
  startMinutes: number;
  endMinutes: number;
  deliveryDate: string;
  isAvailable: boolean;
  riskLevel: "low" | "medium" | "high";
};

export type DeliveryEta = {
  estimatedMinutesMin: number;
  estimatedMinutesMax: number;
  estimatedArrivalLabel: string;
  calculatedAt: string;
  confidence: "low" | "medium" | "high";
  factors: string[];
};

export type DeliveryRoutePlan = {
  routePlanId: string;
  courierId: string | null;
  orderIds: string[];
  stopCount: number;
  totalDistanceKm: number | null;
  totalEtaMinutes: number | null;
  optimized: boolean;
};

export type DeliveryDelayRisk = {
  level: "low" | "medium" | "high" | "critical";
  delayMinutesEstimate: number;
  reasons: string[];
  shouldNotify: boolean;
  shouldReschedule: boolean;
};

export type DeliveryAssignment = {
  courierId: string;
  courierName: string;
  assignedAt: string;
  deliveryEta: DeliveryEta | null;
};

export type DeliveryTimelineEvent = {
  id: string;
  kind: DeliveryTimelineEventKind;
  status: DeliveryStatus;
  title: string;
  message: string;
  createdAt: string;
  actorType: "system" | "admin" | "courier";
  actorName?: string | null;
};

export type DeliveryTask = {
  id: string;
  orderId: string;
  courierId: string | null;
  address: string;
  coordinates: DeliveryCoordinates | null;
  deliveryZoneId: string | null;
  deliveryPriceRub: number | null;
  deliveryDate: string;
  deliveryInterval: string;
  priority: DeliveryPriority;
  status: DeliveryStatus;
  eta: DeliveryEta | null;
  routePlanId: string | null;
  assignment: DeliveryAssignment | null;
  timeline: DeliveryTimelineEvent[];
  createdAt: string;
  updatedAt: string;
  deliveredAt: string | null;
  cancelledAt: string | null;
};

export type DeliveryNotificationPayload = {
  kind: DeliveryNotificationEventKind;
  orderId: string;
  courierId?: string | null;
  address: string;
  deliveryInterval: string;
  status: DeliveryStatus;
  message: string;
  payload: Record<string, string | number | boolean | null>;
};

export type DeliveryListFilters = {
  status?: DeliveryStatus | DeliveryStatus[];
  courierId?: string;
  deliveryDate?: string;
  zoneId?: string;
};

export type AiDeliveryIntelligenceHooks = {
  predictDeliveryDelay?: (
    task: DeliveryTask,
  ) => Promise<DeliveryDelayRisk | null>;
  suggestBestDeliveryWindow?: (
    orderId: string,
    date: string,
  ) => Promise<DeliveryWindow | null>;
  suggestCourierForDelivery?: (
    task: DeliveryTask,
  ) => Promise<{ courierId: string; reason: string } | null>;
  optimizeDeliveryRoute?: (
    task: DeliveryTask,
  ) => Promise<DeliveryRoutePlan | null>;
  detectDeliveryRisk?: (
    task: DeliveryTask,
  ) => Promise<DeliveryDelayRisk | null>;
  summarizeDeliveryPerformance?: (
    date: string,
  ) => Promise<{ summary: string; onTimeRate: number | null }>;
};
