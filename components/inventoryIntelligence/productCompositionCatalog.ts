// ==================================================
// SECTION: INVENTORY INTELLIGENCE
// РАЗДЕЛ: Product composition definitions
// ==================================================
import type { CatalogProductSizeId } from "@/components/catalogEngine/catalogTypes";
import type { ProductCompositionDefinition } from "@/components/inventoryIntelligence/inventoryIntelligenceTypes";

const SIZE_SCALE: Record<CatalogProductSizeId, number> = {
  S: 1,
  M: 1.27,
  L: 1.67,
  XL: 2.2,
};

export const PRODUCT_COMPOSITION_CATALOG: ProductCompositionDefinition[] = [
  {
    productId: "red-luxury",
    requirements: [
      {
        stockItemId: "red_rose",
        quantityBySize: { S: 51, M: 65, L: 85, XL: 112 },
      },
      {
        stockItemId: "eucalyptus",
        quantityBySize: { S: 8, M: 10, L: 12, XL: 16 },
      },
    ],
  },
  {
    productId: "pink-elegance",
    requirements: [
      {
        stockItemId: "eustoma",
        quantityBySize: { S: 12, M: 15, L: 20, XL: 26 },
      },
      {
        stockItemId: "hydrangea",
        quantityBySize: { S: 6, M: 8, L: 10, XL: 13 },
      },
      {
        stockItemId: "eucalyptus",
        quantityBySize: { S: 5, M: 6, L: 8, XL: 11 },
      },
    ],
  },
  {
    productId: "white-pearl",
    requirements: [
      {
        stockItemId: "white_rose",
        quantityBySize: { S: 101, M: 128, L: 169, XL: 222 },
      },
      {
        stockItemId: "eucalyptus",
        quantityBySize: { S: 10, M: 12, L: 16, XL: 22 },
      },
    ],
  },
  {
    productId: "golden-romance",
    forceMadeToOrder: true,
    requirements: [
      {
        stockItemId: "red_rose",
        quantityBySize: { S: 25, M: 32, L: 42, XL: 55 },
      },
      {
        stockItemId: "eustoma",
        quantityBySize: { S: 10, M: 13, L: 17, XL: 22 },
      },
    ],
  },
  {
    productId: "luxury-box",
    requirements: [
      {
        stockItemId: "peony",
        quantityBySize: { S: 11, M: 14, L: 18, XL: 24 },
      },
      {
        stockItemId: "eucalyptus",
        quantityBySize: { S: 6, M: 8, L: 10, XL: 13 },
      },
    ],
  },
  {
    productId: "royal-collection",
    requirements: [
      {
        stockItemId: "white_rose",
        quantityBySize: { S: 15, M: 19, L: 25, XL: 33 },
      },
      {
        stockItemId: "hydrangea",
        quantityBySize: { S: 5, M: 6, L: 8, XL: 11 },
      },
      {
        stockItemId: "peony",
        quantityBySize: { S: 7, M: 9, L: 12, XL: 15 },
      },
      {
        stockItemId: "eucalyptus",
        quantityBySize: { S: 4, M: 5, L: 7, XL: 9 },
      },
    ],
  },
];

export function getProductComposition(
  productId: string,
): ProductCompositionDefinition | null {
  return (
    PRODUCT_COMPOSITION_CATALOG.find(
      (definition) => definition.productId === productId,
    ) ?? null
  );
}

export function resolveRequirementQuantity(
  requirement: ProductCompositionDefinition["requirements"][number],
  sizeId: CatalogProductSizeId,
): number {
  const direct = requirement.quantityBySize[sizeId];
  if (direct !== undefined) {
    return direct;
  }

  const base = requirement.quantityBySize.S ?? 0;
  if (requirement.scalesWithSize) {
    return Math.round(base * SIZE_SCALE[sizeId]);
  }

  return base;
}
