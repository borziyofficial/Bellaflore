// ==================================================
// SECTION: Admin Shell — module types
// РАЗДЕЛ: Типы модулей админ-центра
// ==================================================

export type AdminModuleId = "bellaflore" | "amore-bloom" | "system-control";

export type AdminModuleAvailability = "active" | "coming-soon" | "placeholder";

export type AdminModuleDefinition = {
  id: AdminModuleId;
  label: string;
  shortLabel: string;
  description: string;
  availability: AdminModuleAvailability;
};

export type AdminModuleSection = {
  id: string;
  title: string;
  description: string;
  href?: string;
  statusLabel?: string;
  disabled?: boolean;
};
