export type DeliveryStatus =
  | "orderCreated"
  | "bouquetPreparing"
  | "bouquetReady"
  | "courierAssigned"
  | "courierOnTheWay"
  | "courierNearby"
  | "delivered";

export type DeliveryTrackingData = {
  orderId: string;
  status: DeliveryStatus;
  courier: {
    name: string;
    phone: string;
  };
  vehicle: {
    model: string;
    plate: string;
  };
  estimatedArrivalMinutes: number;
};

export const mockDeliveryTracking: DeliveryTrackingData = {
  orderId: "BF-0001",
  status: "courierOnTheWay",
  courier: {
    name: "Ману́чар",
    phone: "+7 999 000 00 00",
  },
  vehicle: {
    model: "Ford Focus",
    plate: "Р312КН40",
  },
  estimatedArrivalMinutes: 15,
};

export function getDeliveryStatusText(status: DeliveryStatus): string {
  switch (status) {
    case "orderCreated":
      return "Заказ создан";
    case "bouquetPreparing":
      return "Ваш букет собирается";
    case "bouquetReady":
      return "Букет готов";
    case "courierAssigned":
      return "Курьер назначен";
    case "courierOnTheWay":
      return "Курьер выехал";
    case "courierNearby":
      return "Курьер скоро будет у вас";
    case "delivered":
      return "Заказ доставлен";
    default:
      return "Статус заказа неизвестен";
  }
}

export function getEstimatedArrivalText(minutes: number): string {
  if (minutes <= 5) return "Курьер почти у вас";
  return `Ещё ${minutes} минут`;
}
