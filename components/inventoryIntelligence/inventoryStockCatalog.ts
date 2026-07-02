// ==================================================
// SECTION: INVENTORY INTELLIGENCE
// РАЗДЕЛ: Stock catalog seed
// ==================================================
import type {
  AddOnStockItem,
  FlowerStockItem,
  InventoryItem,
} from "@/components/inventoryIntelligence/inventoryIntelligenceTypes";

export const INVENTORY_STOCK_CATALOG_SEED: InventoryItem[] = [
  {
    id: "white_rose",
    title: "Белая роза",
    type: "flower",
    quantity: 320,
    reservedQuantity: 0,
    lowStockThreshold: 40,
    isSeasonal: false,
    seasonMonths: [],
    replacementIds: ["eustoma"],
    isActive: true,
  },
  {
    id: "red_rose",
    title: "Красная роза",
    type: "flower",
    quantity: 210,
    reservedQuantity: 0,
    lowStockThreshold: 35,
    isSeasonal: false,
    seasonMonths: [],
    replacementIds: ["eustoma"],
    isActive: true,
  },
  {
    id: "peony",
    title: "Пион",
    type: "flower",
    quantity: 48,
    reservedQuantity: 0,
    lowStockThreshold: 12,
    isSeasonal: true,
    seasonMonths: [4, 5, 6, 7],
    replacementIds: ["hydrangea", "eustoma"],
    isActive: true,
  },
  {
    id: "hydrangea",
    title: "Гортензия",
    type: "flower",
    quantity: 0,
    reservedQuantity: 0,
    lowStockThreshold: 10,
    isSeasonal: false,
    seasonMonths: [],
    replacementIds: ["eustoma"],
    isActive: true,
  },
  {
    id: "eustoma",
    title: "Эустома",
    type: "flower",
    quantity: 95,
    reservedQuantity: 0,
    lowStockThreshold: 15,
    isSeasonal: false,
    seasonMonths: [],
    replacementIds: ["white_rose", "red_rose"],
    isActive: true,
  },
  {
    id: "eucalyptus",
    title: "Эвкалипт",
    type: "flower",
    quantity: 140,
    reservedQuantity: 0,
    lowStockThreshold: 20,
    isSeasonal: false,
    seasonMonths: [],
    replacementIds: [],
    isActive: true,
  },
  {
    id: "greeting-card",
    title: "Открытка",
    type: "add_on",
    quantity: 500,
    reservedQuantity: 0,
    lowStockThreshold: 50,
    isSeasonal: false,
    seasonMonths: [],
    replacementIds: [],
    isActive: true,
  },
  {
    id: "vase",
    title: "Ваза",
    type: "add_on",
    quantity: 36,
    reservedQuantity: 0,
    lowStockThreshold: 6,
    isSeasonal: false,
    seasonMonths: [],
    replacementIds: [],
    isActive: true,
  },
  {
    id: "candles",
    title: "Свеча",
    type: "add_on",
    quantity: 72,
    reservedQuantity: 0,
    lowStockThreshold: 10,
    isSeasonal: false,
    seasonMonths: [],
    replacementIds: [],
    isActive: true,
  },
  {
    id: "sweets",
    title: "Конфеты",
    type: "add_on",
    quantity: 120,
    reservedQuantity: 0,
    lowStockThreshold: 15,
    isSeasonal: false,
    seasonMonths: [],
    replacementIds: [],
    isActive: true,
  },
  {
    id: "plush-toy",
    title: "Игрушка",
    type: "add_on",
    quantity: 28,
    reservedQuantity: 0,
    lowStockThreshold: 5,
    isSeasonal: false,
    seasonMonths: [],
    replacementIds: [],
    isActive: true,
  },
];

export function asFlowerStockItem(item: InventoryItem): FlowerStockItem | null {
  if (item.type !== "flower") {
    return null;
  }

  return {
    ...item,
    type: "flower",
    flowerKey: item.id,
  };
}

export function asAddOnStockItem(item: InventoryItem): AddOnStockItem | null {
  if (item.type !== "add_on") {
    return null;
  }

  return {
    ...item,
    type: "add_on",
    addOnCatalogId: item.id,
  };
}
