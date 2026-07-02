// ==================================================
// SECTION: MY PROFILE
// РАЗДЕЛ: Типы модульного хаба профиля
// ==================================================

export type ProfileHubSectionId =
  | "personal"
  | "myOrder"
  | "tracking"
  | "favorites"
  | "contact";

export type ProfileHubMenuItem = {
  id: ProfileHubSectionId;
  label: string;
  hint?: string;
  /** navigate = drill-down inside hub; external = delegate to parent handler */
  action: "navigate" | "external";
};

export const PROFILE_HUB_MENU: ProfileHubMenuItem[] = [
  { id: "personal", label: "Личные данные", action: "navigate" },
  { id: "myOrder", label: "Мой заказ", action: "navigate" },
  {
    id: "tracking",
    label: "Отслеживание заказа",
    hint: "Скоро",
    action: "navigate",
  },
  { id: "favorites", label: "Избранное", action: "external" },
  { id: "contact", label: "Связь", action: "external" },
];
