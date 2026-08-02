import "server-only";

import { getOrdersSqlClient } from "@/lib/orders/postgresClient";
import { OrderError } from "@/lib/orders/errors";
import {
  ORDER_SIZE_CODES,
  type OrderCatalogGateway,
  type OrderCatalogProduct,
  type OrderSizeCode,
} from "@/lib/orders/types";

type CatalogProductRow = {
  id: string;
  slug: string;
  title: string;
  sizes: unknown;
};

type BouquetRow = {
  id: string;
  slug: string;
  name: string;
  base_price: string | number;
  sizes: unknown;
};

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readPositiveInteger(value: unknown): number | null {
  const price = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(price) && price > 0 ? price : null;
}

function parseCatalogSizes(value: unknown): Partial<Record<OrderSizeCode, number>> {
  const raw = readObject(value);
  return Object.fromEntries(
    ORDER_SIZE_CODES.flatMap((size) => {
      const price = readPositiveInteger(raw[size]);
      return price === null ? [] : [[size, price]];
    }),
  );
}

function parseBouquetSizes(
  value: unknown,
  basePrice: string | number,
): Partial<Record<OrderSizeCode, number>> {
  const raw = readObject(value);
  const sizes = Object.fromEntries(
    ORDER_SIZE_CODES.flatMap((size) => {
      const entry = readObject(raw[size]);
      const price = entry.enabled === true ? readPositiveInteger(entry.price) : null;
      return price === null ? [] : [[size, price]];
    }),
  ) as Partial<Record<OrderSizeCode, number>>;

  if (Object.keys(sizes).length === 0) {
    const fallback = readPositiveInteger(basePrice);
    if (fallback !== null) {
      sizes.S = fallback;
    }
  }
  return sizes;
}

export class PostgresOrderCatalogGateway implements OrderCatalogGateway {
  async getProductsByIds(ids: string[]): Promise<Map<string, OrderCatalogProduct>> {
    if (ids.length === 0) {
      return new Map();
    }

    const sql = getOrdersSqlClient();
    const [catalogRows, bouquetRows] = await Promise.all([
      sql<CatalogProductRow[]>`
        SELECT id, slug, title, sizes
        FROM catalog_products
        WHERE status = 'published' AND id = ANY(${ids})
      `,
      sql<BouquetRow[]>`
        SELECT id, slug, name, base_price, sizes
        FROM admin_bouquets
        WHERE status = 'active'
          AND COALESCE((display_flags ->> 'showInCatalog')::boolean, false) = true
          AND id = ANY(${ids})
      `,
    ]);

    const products = new Map<string, OrderCatalogProduct>();
    for (const row of catalogRows) {
      products.set(row.id, {
        source: "catalog_products",
        id: row.id,
        slug: row.slug,
        name: row.title,
        sizes: parseCatalogSizes(row.sizes),
      });
    }
    for (const row of bouquetRows) {
      if (products.has(row.id)) {
        throw new OrderError(
          "PRODUCT_UNAVAILABLE",
          "В каталоге обнаружен неоднозначный идентификатор товара.",
          409,
          { productId: row.id },
        );
      }
      products.set(row.id, {
        source: "admin_bouquets",
        id: row.id,
        slug: row.slug,
        name: row.name,
        sizes: parseBouquetSizes(row.sizes, row.base_price),
      });
    }
    return products;
  }
}
