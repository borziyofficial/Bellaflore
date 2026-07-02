// ==================================================
// SECTION: HERO
// РАЗДЕЛ: Главный экран
//
// Purpose (EN):
// Reusable BellaFlore brand logo with size variants
//
// Назначение (RU):
// Логотип BellaFlore с вариантами размера
// ==================================================
import type { ElementType } from "react";

type BrandLogoVariant = "hero" | "nav" | "panel" | "compact" | "hub";

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  className?: string;
  as?: ElementType;
};

export function BrandLogo({
  variant = "panel",
  className = "",
  as: Tag = "span",
}: BrandLogoProps) {
  const classes = ["bf-brand-logo", `bf-brand-logo--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return <Tag className={classes}>BellaFlore</Tag>;
}
