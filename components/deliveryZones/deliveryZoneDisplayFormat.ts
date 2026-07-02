// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Display formatting (map legend / marketing)
// ==================================================

export function formatDeliveryZonePriceRub(priceRub: number): string {
  return `${priceRub.toLocaleString("ru-RU")} ₽`;
}
