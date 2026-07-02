// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Фирменный pin Bellaflore для карты
//
// Purpose (EN): Branded map pin assets (display only).
// Назначение (RU): Фирменный pin для карты (только отображение).
// ==================================================

const BELLAFlore_MAP_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34" fill="none">
  <defs>
    <linearGradient id="bfPinGrad" x1="13" y1="1" x2="13" y2="31" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fce3ea"/>
      <stop offset="1" stop-color="#f286a4"/>
    </linearGradient>
    <filter id="bfPinShadow" x="-20%" y="-10%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#3b2f33" flood-opacity="0.28"/>
    </filter>
  </defs>
  <path filter="url(#bfPinShadow)" fill="url(#bfPinGrad)" stroke="#fff" stroke-width="1.4" d="M13 1.2C8.2 1.2 4.2 5.2 4.2 10c0 7.2 8.8 19.8 8.8 19.8s8.8-12.6 8.8-19.8c0-4.8-4-8.8-8.8-8.8Z"/>
  <circle cx="13" cy="10" r="3.2" fill="#fff" fill-opacity="0.92"/>
  <circle cx="13" cy="10" r="1.4" fill="#efa9c2"/>
</svg>`;

export const BELLAFlore_MAP_PIN_DATA_URI = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  BELLAFlore_MAP_PIN_SVG,
)}`;

export const BELLAFlore_MAP_PIN_SIZE: [number, number] = [26, 34];
export const BELLAFlore_MAP_PIN_OFFSET: [number, number] = [-13, -34];

export const BELLAFlore_MAP_PIN_VIEWBOX = { width: 26, height: 34 };

export function getBellafloreMapPinPlacemarkOptions() {
  return {
    iconLayout: "default#image",
    iconImageHref: BELLAFlore_MAP_PIN_DATA_URI,
    iconImageSize: BELLAFlore_MAP_PIN_SIZE,
    iconImageOffset: BELLAFlore_MAP_PIN_OFFSET,
  };
}
