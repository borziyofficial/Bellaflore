export type DeliveryInterval = {
  label: string;
  startMinutes: number;
  endMinutes: number;
};

export const deliveryIntervals: DeliveryInterval[] = [
  { label: "09:00–12:00", startMinutes: 9 * 60, endMinutes: 12 * 60 },
  { label: "12:00–15:00", startMinutes: 12 * 60, endMinutes: 15 * 60 },
  { label: "15:00–18:00", startMinutes: 15 * 60, endMinutes: 18 * 60 },
  { label: "18:00–21:00", startMinutes: 18 * 60, endMinutes: 21 * 60 },
  { label: "21:00–23:00", startMinutes: 21 * 60, endMinutes: 23 * 60 },
];

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getAvailableDeliveryIntervals(
  deliveryDate: string,
  now: Date,
) {
  if (!deliveryDate) {
    return [];
  }

  const todayDateValue = formatDateInputValue(now);

  if (deliveryDate !== todayDateValue) {
    return deliveryIntervals;
  }

  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

  return deliveryIntervals.filter(
    (interval) => interval.endMinutes > currentTimeMinutes,
  );
}
