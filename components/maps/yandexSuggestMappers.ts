// ==================================================
// SECTION: YANDEX MAP / ADDRESS INTELLIGENCE
// РАЗДЕЛ: Яндекс Карта / Умный поиск адресов
// ==================================================
import type { LiveGeocoderSuggestion } from "@/components/addressIntelligence/liveGeocoderTypes";
import type { YandexSuggestItem } from "@/components/maps/yandexMapsApi.types";

function buildSuggestionId(fullAddress: string, index: number): string {
  return `yandex-suggest-${index}-${fullAddress
    .toLowerCase()
    .replace(/\s+/g, "-")
    .slice(0, 80)}`;
}

function splitAddressParts(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function isTerritoryLikePart(part: string): boolean {
  return /^(террит|снт|днт|кп|ст\b|пос\.|посёлок|дер\.|деревня|мкр\.|микрорайон)/i.test(
    part,
  );
}

function isStreetLikePart(part: string): boolean {
  return (
    /\d/.test(part) ||
    /(ул\.?|улица|пр\.?|проспект|пер\.?|переулок|ш\.?|шоссе|б-?р\.?|бульвар|наб\.?|набережная|ал\.?|аллея|пл\.?|площадь|проезд|линия|квартал)/i.test(
      part,
    )
  );
}

function isAdministrativePart(part: string): boolean {
  return (
    isTerritoryLikePart(part) ||
    part === "Россия" ||
    part.includes("Московская область") ||
    part === "Москва" ||
    /\bрайон\b/i.test(part)
  );
}

function buildSuggestionPrimaryLine(value: string, displayName: string): string {
  const displayParts = splitAddressParts(displayName);

  if (displayParts.length >= 2) {
    const street = displayParts[0] ?? "";
    const house = displayParts[1] ?? "";

    if (
      street &&
      house &&
      !isTerritoryLikePart(street) &&
      (/\d/.test(house) || isStreetLikePart(street))
    ) {
      const cleanStreet = street.replace(/^(ул\.?\s*|улица\s+)/i, "").trim();
      const cleanHouse = house.replace(/^(д\.?\s*|дом\s+)/i, "").trim();
      return `${cleanStreet} ${cleanHouse}`.trim();
    }
  }

  const displayPrimary = displayParts[0] ?? "";

  if (displayPrimary && !isTerritoryLikePart(displayPrimary)) {
    return displayPrimary.replace(/^(ул\.?\s*|улица\s+)/i, "").trim();
  }

  const parts = splitAddressParts(value);
  const streetPart = parts.find((part) => isStreetLikePart(part));

  if (streetPart) {
    return streetPart.replace(/^(ул\.?\s*|улица\s+)/i, "").trim();
  }

  const meaningfulParts = parts.filter((part) => !isAdministrativePart(part));

  if (meaningfulParts.length >= 2) {
    return meaningfulParts.slice(0, 2).join(" ");
  }

  if (meaningfulParts.length === 1) {
    return meaningfulParts[0]!;
  }

  return displayPrimary || value;
}

function buildSuggestionDistrictLine(value: string): string {
  const parts = splitAddressParts(value).filter((part) => part !== "Россия");
  const district = parts.find(
    (part) => /\bрайон\b/i.test(part) && !isTerritoryLikePart(part),
  );

  if (!district) {
    return "";
  }

  return district.replace(/\s+район.*$/i, " район").trim();
}

function buildSuggestionCityLine(value: string): string {
  const parts = splitAddressParts(value).filter((part) => part !== "Россия");

  if (parts.includes("Москва")) {
    return "Москва";
  }

  const regionIndex = parts.findIndex((part) =>
    part.includes("Московская область"),
  );

  if (regionIndex >= 0) {
    const locality = parts
      .slice(regionIndex + 1)
      .find(
        (part) =>
          !isTerritoryLikePart(part) &&
          !isStreetLikePart(part) &&
          !/\bрайон\b/i.test(part),
      );

    return locality ?? "Московская область";
  }

  return "";
}

function extractStreetFromDisplayName(displayName: string): string {
  return displayName.split(",")[0]?.trim() ?? "";
}

export function mapYandexSuggestItemToSuggestion(
  item: YandexSuggestItem,
  index: number,
): LiveGeocoderSuggestion | null {
  const displayName = item.displayName?.trim();
  const value = item.value?.trim();

  if (!displayName || !value) {
    return null;
  }

  const street = extractStreetFromDisplayName(displayName);
  const label = buildSuggestionPrimaryLine(value, displayName);
  const districtLine = buildSuggestionDistrictLine(value);
  const city = buildSuggestionCityLine(value);

  return {
    id: buildSuggestionId(value, index),
    label,
    fullAddress: value,
    city,
    districtLine: districtLine || undefined,
    street,
    house: "",
    confidence: 0.82,
    provider: "yandex",
    raw: value,
    yandexUri: item.uri?.trim() || undefined,
  };
}
