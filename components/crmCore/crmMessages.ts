// ==================================================
// SECTION: MESSAGES
// РАЗДЕЛ: Сообщения
//
// Purpose (EN): User-facing and log message strings for crmCore.
//
// Назначение (RU): Пользовательские и служебные сообщения для crmCore.
// ==================================================
export function getCrmNewOrderMessage(orderId: string): string {
  return `Новый заказ ${orderId} поступил в CRM`;
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function getCrmActiveOrderMessage(orderId: string): string {
  return `Заказ ${orderId} в активной обработке`;
}

export function getCrmDelayedOrderMessage(orderId: string): string {
  return `Заказ ${orderId} задерживается`;
}

export function getCrmCompletedOrderMessage(orderId: string): string {
  return `Заказ ${orderId} завершён`;
}

export function getCrmCancelledOrderMessage(orderId: string): string {
  return `Заказ ${orderId} отменён`;
}

export function getCrmVipCustomerMessage(customerName: string): string {
  return `VIP-клиент: ${customerName}`;
}

export function getCrmHighPriorityOrderMessage(orderId: string): string {
  return `Высокий приоритет: заказ ${orderId}`;
}

export function getCrmOrderStatusUpdatedMessage(
  orderId: string,
  status: string,
): string {
  return `Статус заказа ${orderId} обновлён: ${status}`;
}

export function getCrmCustomerUpdatedMessage(customerName: string): string {
  return `Карточка клиента обновлена: ${customerName}`;
}
