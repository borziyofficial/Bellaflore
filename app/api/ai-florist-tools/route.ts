import { loadPublishedStorefrontCatalog } from "@/lib/catalogDb/publicStorefront";
import { calculateServerDeliveryPrice } from "@/lib/orders/deliveryPricing";
import type { CatalogProduct } from "@/data/catalogProducts";

export const runtime = "nodejs";

type ToolRequest = {
  tool: string;
  params: Record<string, unknown>;
};

type ToolResponse = {
  status: "ok" | "error";
  data?: unknown;
  message?: string;
};

function validateString(value: unknown, maxLength: number = 500): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim().slice(0, maxLength);
}

function validatePhone(value: unknown): string | null {
  const str = validateString(value, 20);
  if (!str) return null;
  const digits = str.replace(/[^0-9]/g, "");
  if (digits.length < 10 || digits.length > 20) return null;
  return str;
}

function validatePrice(value: unknown): number | null {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 1_000_000) return null;
  return Math.round(num);
}

async function searchProducts(params: {
  query?: unknown;
  maxPrice?: unknown;
  minPrice?: unknown;
  category?: unknown;
  flowerType?: unknown;
  limit?: unknown;
}): Promise<ToolResponse> {
  try {
    const catalogResult = await loadPublishedStorefrontCatalog();
    if (catalogResult.status !== "success") {
      return { status: "error", message: "Каталог недоступен" };
    }

    const { products } = catalogResult;
    const query = validateString(params.query) || "";
    let maxPrice = 1_000_000;
    let minPrice = 0;

    if (params.maxPrice !== undefined && params.maxPrice !== null) {
      const parsed = validatePrice(params.maxPrice);
      if (parsed !== null) maxPrice = parsed;
    }
    if (params.minPrice !== undefined && params.minPrice !== null) {
      const parsed = validatePrice(params.minPrice);
      if (parsed !== null) minPrice = parsed;
    }

    const category = validateString(params.category);
    const flowerType = validateString(params.flowerType);
    const limit = Math.min(Math.max(1, Number(params.limit) || 5), 20);
    const lowerQuery = query.toLowerCase();

    let filtered = products.filter((product: CatalogProduct) => {
      if (product.priceRub < minPrice || product.priceRub > maxPrice) return false;
      if (lowerQuery) {
        const searchText = [
          product.title,
          product.description,
          product.flowerType,
          product.category,
          ...(product.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchText.includes(lowerQuery)) return false;
      }
      return true;
    });

    const results = filtered.slice(0, limit).map((p: CatalogProduct) => ({
      id: p.id,
      title: p.title,
      priceRub: p.priceRub,
    }));

    return { status: "ok", data: { products: results } };
  } catch (error) {
    console.error("[ai-tools] search error:", error);
    return { status: "error", message: "Ошибка при поиске" };
  }
}

async function validateAddress(params: { address?: unknown }): Promise<ToolResponse> {
  try {
    const address = validateString(params.address);
    if (!address) {
      return { status: "error", message: "Адрес не указан" };
    }

    const url = new URL(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/yandex-geocode`);
    url.searchParams.set("geocode", address);

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      return { status: "error", message: "Не удалось проверить адрес" };
    }

    const data = (await response.json()) as any;
    const first = data.results?.[0];

    if (!first?.latitude || !first?.longitude) {
      return { status: "error", message: "Не удалось определить координаты" };
    }

    return {
      status: "ok",
      data: {
        address: first.formattedAddress || address,
        latitude: first.latitude,
        longitude: first.longitude,
      },
    };
  } catch (error) {
    console.error("[ai-tools] validate error:", error);
    return { status: "error", message: "Ошибка при проверке адреса" };
  }
}

async function calculateDelivery(params: { latitude?: unknown; longitude?: unknown }): Promise<ToolResponse> {
  try {
    const latitude = Number(params.latitude);
    const longitude = Number(params.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return { status: "error", message: "Некорректные координаты" };
    }

    const delivery = await calculateServerDeliveryPrice(latitude, longitude);
    return {
      status: "ok",
      data: {
        zoneId: delivery.zoneId,
        deliveryFee: delivery.cost,
      },
    };
  } catch (error) {
    console.error("[ai-tools] delivery error:", error);
    return { status: "error", message: "Адрес вне зоны доставки" };
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ToolRequest;
    const { tool, params } = body;

    if (!tool) {
      return Response.json({ status: "error", message: "Tool required" }, { status: 400 });
    }

    let result: ToolResponse;

    switch (tool) {
      case "search_products":
        result = await searchProducts(params);
        break;
      case "validate_address":
        result = await validateAddress(params);
        break;
      case "calculate_delivery":
        result = await calculateDelivery(params);
        break;
      default:
        return Response.json({ status: "error", message: `Unknown tool: ${tool}` }, { status: 400 });
    }

    return Response.json(result);
  } catch (error) {
    console.error("[ai-tools] error:", error);
    return Response.json({ status: "error", message: "Invalid request" }, { status: 400 });
  }
}
