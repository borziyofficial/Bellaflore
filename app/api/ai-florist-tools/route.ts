import { loadPublishedStorefrontCatalog } from "@/lib/catalogDb/publicStorefront";
import { calculateServerDeliveryPrice } from "@/lib/orders/deliveryPricing";
import type { CatalogProduct } from "@/data/catalogProducts";

// ==================================================
// SECTION: AI FLORIST TOOLS v1.1 INTEGRATION
// Real services: Yandex geocoding, delivery zones, order storage
// ==================================================

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

// ==================================================
// RUNTIME VALIDATION HELPERS
// ==================================================

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

function validatePositivePrice(value: unknown): number | null {
  const price = validatePrice(value);
  if (price === null || price <= 0) return null;
  return price;
}

// ==================================================
// TOOL: search_products
// Real catalog search with price edge case handling
// ==================================================
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
      return {
        status: "error",
        message: "Каталог недоступен",
      };
    }

    const { products } = catalogResult;
    const query = validateString(params.query) || "";
    
    // Handle price edges: Infinity becomes no limit, non-finite becomes 0
    let maxPrice = 1_000_000; // default reasonable max
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
      // Price filter
      if (product.priceRub < minPrice || product.priceRub > maxPrice) {
        return false;
      }

      // Text search
      if (lowerQuery) {
        const searchText = [
          product.title,
          product.description,
          product.flowerType,
          product.category,
          ...(product.tags || []),
          ...(product.searchTerms || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchText.includes(lowerQuery)) {
          return false;
        }
      }

      // Category filter
      if (category && product.category) {
        if (!product.category.toLowerCase().includes(category.toLowerCase())) {
          return false;
        }
      }

      // Flower type filter
      if (flowerType && product.flowerType) {
        if (!product.flowerType.toLowerCase().includes(flowerType.toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    // Sort by popularity/price relevance
    filtered.sort((a: CatalogProduct, b: CatalogProduct) => {
      const scoreA = (a.isPopular ? 10 : 0) - Math.abs((a.priceRub || 0) - (maxPrice + minPrice) / 2) / 100;
      const scoreB = (b.isPopular ? 10 : 0) - Math.abs((b.priceRub || 0) - (maxPrice + minPrice) / 2) / 100;
      return scoreB - scoreA;
    });

    const results = filtered.slice(0, limit).map((p: CatalogProduct) => ({
      id: p.id,
      slug: p.slug || p.id,
      title: p.title,
      description: p.description,
      priceRub: p.priceRub,
      flowerType: p.flowerType,
      category: p.category,
      tags: p.tags,
      image: p.src,
      availability: p.availability,
    }));

    return {
      status: "ok",
      data: {
        products: results,
        count: results.length,
        totalAvailable: filtered.length,
      },
    };
  } catch (error) {
    console.error("[ai-tools] search_products error:", error);
    return {
      status: "error",
      message: "Ошибка при поиске товаров",
    };
  }
}

// ==================================================
// TOOL: get_product
// Retrieve full product details from catalog
// ==================================================
async function getProduct(params: {
  id?: unknown;
  slug?: unknown;
}): Promise<ToolResponse> {
  try {
    const catalogResult = await loadPublishedStorefrontCatalog();

    if (catalogResult.status !== "success") {
      return {
        status: "error",
        message: "Каталог недоступен",
      };
    }

    const { products } = catalogResult;
    const id = validateString(params.id);
    const slug = validateString(params.slug);

    if (!id && !slug) {
      return {
        status: "error",
        message: "ID или slug товара обязателен",
      };
    }

    const product = products.find(
      (p: CatalogProduct) => (id && p.id === id) || (slug && p.slug === slug)
    );

    if (!product) {
      return {
        status: "error",
        message: "Товар не найден",
      };
    }

    return {
      status: "ok",
      data: {
        id: product.id,
        slug: product.slug || product.id,
        title: product.title,
        description: product.description,
        priceRub: product.priceRub,
        flowerType: product.flowerType,
        category: product.category,
        tags: product.tags,
        image: product.src,
        availability: product.availability,
        composition: product.composition,
        care: product.care,
        sizes: product.sizes,
      },
    };
  } catch (error) {
    console.error("[ai-tools] get_product error:", error);
    return {
      status: "error",
      message: "Ошибка при загрузке товара",
    };
  }
}

// ==================================================
// TOOL: validate_address (REAL YANDEX INTEGRATION)
// Validate address and get coordinates via Yandex Geocoder
// ==================================================
async function validateAddress(params: {
  address?: unknown;
}): Promise<ToolResponse> {
  try {
    const address = validateString(params.address);
    if (!address) {
      return {
        status: "error",
        message: "Адрес не указан",
      };
    }

    // Call the existing Yandex geocode API route
    const geocodeUrl = new URL(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/yandex-geocode`);
    geocodeUrl.searchParams.set("geocode", address);

    const response = await fetch(geocodeUrl.toString(), {
      headers: {
        Accept: "application/json",
        Referer: "http://localhost:3000/ai-consultant",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      return {
        status: "error",
        message: "Не удалось проверить адрес. Попробуйте уточнить.",
      };
    }

    const result = (await response.json()) as {
      results?: Array<{
        formattedAddress?: string;
        latitude?: number;
        longitude?: number;
        precision?: string;
      }>;
    };

    if (!result.results || result.results.length === 0) {
      return {
        status: "error",
        message: "Адрес не найден. Проверьте написание.",
      };
    }

    const first = result.results[0];
    const latitude = first.latitude;
    const longitude = first.longitude;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return {
        status: "error",
        message: "Не удалось определить координаты адреса.",
      };
    }

    return {
      status: "ok",
      data: {
        address: first.formattedAddress || address,
        latitude,
        longitude,
        precision: first.precision,
        validated: true,
      },
    };
  } catch (error) {
    console.error("[ai-tools] validate_address error:", error);
    return {
      status: "error",
      message: "Ошибка при проверке адреса",
    };
  }
}

// ==================================================
// TOOL: calculate_delivery (REAL DELIVERY ZONES)
// Calculate delivery fee using real delivery zones
// ==================================================
async function calculateDelivery(params: {
  latitude?: unknown;
  longitude?: unknown;
  date?: unknown;
}): Promise<ToolResponse> {
  try {
    const latitude = Number(params.latitude);
    const longitude = Number(params.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return {
        status: "error",
        message: "Некорректные координаты адреса",
      };
    }

    // Use the real delivery pricing calculation
    const delivery = await calculateServerDeliveryPrice(latitude, longitude);

    return {
      status: "ok",
      data: {
        zoneId: delivery.zoneId,
        deliveryFee: delivery.cost,
        latitude,
        longitude,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("DELIVERY_OUTSIDE_AREA")) {
      return {
        status: "error",
        message: "Адрес находится вне зоны доставки",
      };
    }
    console.error("[ai-tools] calculate_delivery error:", error);
    return {
      status: "error",
      message: "Ошибка при расчёте доставки",
    };
  }
}

// ==================================================
// TOOL: create_order_draft
// Create a draft order (placeholder for now)
// ==================================================
async function createOrderDraft(params: {
  productId?: unknown;
  productTitle?: unknown;
  price?: unknown;
}): Promise<ToolResponse> {
  try {
    const productId = validateString(params.productId);
    const productTitle = validateString(params.productTitle);
    const price = validatePrice(params.price);

    if (!productId || !productTitle || price === null) {
      return {
        status: "error",
        message: "Не указаны обязательные параметры товара",
      };
    }

    // Generate draft ID
    const draftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      status: "ok",
      data: {
        draftId,
        product: {
          id: productId,
          title: productTitle,
          price,
        },
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("[ai-tools] create_order_draft error:", error);
    return {
      status: "error",
      message: "Ошибка при создании черновика",
    };
  }
}

// ==================================================
// TOOL: update_order_draft
// Update draft with customer/delivery details
// ==================================================
async function updateOrderDraft(params: {
  draftId?: unknown;
  customerName?: unknown;
  customerPhone?: unknown;
  recipientName?: unknown;
  address?: unknown;
}): Promise<ToolResponse> {
  try {
    const draftId = validateString(params.draftId);
    if (!draftId) {
      return {
        status: "error",
        message: "Draft ID не указан",
      };
    }

    const customerName = validateString(params.customerName);
    const customerPhone = validatePhone(params.customerPhone);
    const recipientName = validateString(params.recipientName);
    const address = validateString(params.address);

    return {
      status: "ok",
      data: {
        draftId,
        updated: {
          customerName,
          customerPhone,
          recipientName,
          address,
        },
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("[ai-tools] update_order_draft error:", error);
    return {
      status: "error",
      message: "Ошибка при обновлении черновика",
    };
  }
}

// ==================================================
// TOOL: get_payment_options
// Return real payment methods (hardcoded for now, can be extended)
// ==================================================
async function getPaymentOptions(): Promise<ToolResponse> {
  return {
    status: "ok",
    data: {
      options: [
        { id: "card", label: "Банковская карта", available: true },
        { id: "sbp", label: "СБП", available: true },
      ],
    },
  };
}

// ==================================================
// MAIN ROUTING
// ==================================================
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ToolRequest;
    const { tool, params } = body;

    if (!tool || typeof tool !== "string") {
      return Response.json(
        { status: "error", message: "Tool name required" },
        { status: 400 }
      );
    }

    let result: ToolResponse;

    switch (tool) {
      case "search_products":
        result = await searchProducts(params);
        break;
      case "get_product":
        result = await getProduct(params);
        break;
      case "validate_address":
        result = await validateAddress(params);
        break;
      case "calculate_delivery":
        result = await calculateDelivery(params);
        break;
      case "create_order_draft":
        result = await createOrderDraft(params);
        break;
      case "update_order_draft":
        result = await updateOrderDraft(params);
        break;
      case "get_payment_options":
        result = await getPaymentOptions();
        break;
      default:
        return Response.json(
          { status: "error", message: `Unknown tool: ${tool}` },
          { status: 400 }
        );
    }

    return Response.json(result);
  } catch (error) {
    console.error("[ai-tools] request error:", error);
    return Response.json(
      { status: "error", message: "Invalid request" },
      { status: 400 }
    );
  }
}
