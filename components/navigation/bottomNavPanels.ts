// ==================================================
// SECTION: NAVIGATION
// РАЗДЕЛ: Навигация
//
// Purpose (EN):
// Bottom navigation panel definitions and section routing config.
//
// Назначение (RU):
// Определения нижней навигации и конфигурация разделов.
// ==================================================
export type BottomNavPanelId = "catalog" | "favorites" | "contact" | "myOrder";


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
export const BOTTOM_NAV_PANEL_CLOSE_MS = 140;

export function getBottomNavPanelOpenMessage(
  panelId: BottomNavPanelId,
  options: {
    favoriteCount?: number;
    hasOrders?: boolean;
  } = {},
): string {
  switch (panelId) {
    case "catalog":
      return "Открыт каталог Bellaflore";
    case "favorites":
      return (options.favoriteCount ?? 0) > 0
        ? "Открыто избранное"
        : "Избранное пока пусто";
    case "contact":
      return "Открыты быстрые способы связи";
    case "myOrder":
      return options.hasOrders ? "Открыт мой профиль" : "Профиль: заказ пока не создан";
    default:
      return "";
  }
}

export function getBottomNavPanelClosedMessage(panelId: BottomNavPanelId): string {
  switch (panelId) {
    case "catalog":
      return "Каталог закрыт";
    case "favorites":
      return "Избранное закрыто";
    case "contact":
      return "Связь закрыта";
    case "myOrder":
      return "Профиль закрыт";
    default:
      return "Главная";
  }
}
