// ==================================================
// SECTION: Homepage content blocks — shared types
// РАЗДЕЛ: Управляемые блоки главной страницы — общие типы
// ==================================================
// Generic admin-managed content block pattern, following the same shape as
// promo-banner / visual-stories: a block has section-level copy (title,
// subtitle, optional CTA) plus an ordered list of cards (image, title,
// subtitle, optional CTA, enable/disable). Three kinds cover the homepage
// sections that previously had no CMS control: "featured" highlights,
// "seasonal" occasion picks, and the single "ctaBand" banner before the
// footer. (The "premium editorial/story" section required by the brief is
// already served by the existing AboutSection — no duplicate block needed.)

export type HomepageBlockKind = "featured" | "seasonal" | "ctaBand";

export const HOMEPAGE_BLOCK_KINDS: HomepageBlockKind[] = ["featured", "seasonal", "ctaBand"];

export type HomepageBlockCard = {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  isEnabled: boolean;
  sortOrder: number;
};

export type HomepageBlock = {
  kind: HomepageBlockKind;
  isEnabled: boolean;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  cards: HomepageBlockCard[];
  updatedAt: string;
};

export function isHomepageBlockKind(value: unknown): value is HomepageBlockKind {
  return typeof value === "string" && (HOMEPAGE_BLOCK_KINDS as string[]).includes(value);
}
