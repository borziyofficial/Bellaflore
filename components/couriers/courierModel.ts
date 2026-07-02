// ==================================================
// SECTION: COURIERS
// РАЗДЕЛ: Курьеры
//
// Purpose (EN):
// Demo courier registry and lookup helpers.
//
// Назначение (RU):
// Демо-реестр курьеров и хелперы поиска.
// ==================================================
export type Courier = {
  id: string;
  fullName: string;
  phone: string;
  isAvailable: boolean;
};

export const DEMO_COURIERS: Courier[] = [
  {
    id: "courier-ahmad",
    fullName: "Ahmad",
    phone: "+998 90 100 0001",
    isAvailable: true,
  },
  {
    id: "courier-ali",
    fullName: "Ali",
    phone: "+998 90 100 0002",
    isAvailable: true,
  },
  {
    id: "courier-bekzod",
    fullName: "Bekzod",
    phone: "+998 90 100 0003",
    isAvailable: true,
  },
  {
    id: "courier-muhammad",
    fullName: "Muhammad",
    phone: "+998 90 100 0004",
    isAvailable: true,
  },
];


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN):
// Public exported functions and constants.
//
// Назначение (RU):
// Публичные экспортируемые функции и константы.
// ==================================================
export function getDemoCouriers(): Courier[] {
  return DEMO_COURIERS;
}

export function findCourierById(courierId: string): Courier | null {
  const normalizedCourierId = courierId.trim();

  if (!normalizedCourierId) {
    return null;
  }

  return (
    DEMO_COURIERS.find((courier) => courier.id === normalizedCourierId) ?? null
  );
}
