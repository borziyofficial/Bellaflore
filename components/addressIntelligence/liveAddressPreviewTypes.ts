// ==================================================
// SECTION: ADDRESS INTELLIGENCE
// РАЗДЕЛ: Интеллект адресов
//
// Purpose (EN):
// Type definitions for live address preview state.
//
// Назначение (RU):
// Типы состояния live-превью адреса.
// ==================================================
export type LiveAddressPreviewStatus =
  | "idle"
  | "selected"
  | "geocoded"
  | "no_coordinates"
  | "error";

export type LiveAddressPreview = {
  selectedAddress: string;
  latitude: number | null;
  longitude: number | null;
  hasCoordinates: boolean;
  previewStatus: LiveAddressPreviewStatus;
  updatedAt: string;
};
