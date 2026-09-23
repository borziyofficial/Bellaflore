import { loadPublishedStorefrontCatalog } from "@/lib/catalogDb/publicStorefront";
import { calculateServerDeliveryPrice } from "@/lib/orders/deliveryPricing";
import { PostgresOrderDraftRepository } from "@/lib/orders/draftRepository";
import { PostgresOrderCatalogGateway } from "@/lib/orders/catalogGateway";
import { PostgresOrderRepository } from "@/lib/orders/repository";
import { createOrderService } from "@/lib/orders/service";
import type { CatalogProduct } from "@/data/catalogProducts";
import type { UpdateOrderDraftInput } from "@/lib/orders/draftTypes";
import type { CreateOrderInput } from "@/lib/orders/types";
import { createHash } from "crypto";

// ==================================================
// SECTION: AI FLORIST TOOLS v2.0 INTEGRATION
// Real services: Yandex geocoding, delivery zones, order storage, draft management
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

function validateString(value: unknown, maxLength: number = 500): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  return value.trim().slice(0, maxLength);
}

function validatePhone(value: unknown): string | undefined {
  const str = validateString(value, 20);
  if (!str) return undefined;
  const digits = str.replace(/[^0-9]/g, "");
  if (digits.length < 10 || digits.length > 20) return undefined;
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
// TOOL: update_draft
// Update draft with conversation turns and collected data
// ==================================================
async function updateDraft(params: {
  draftId?: unknown;
  conversationState?: unknown;
  customerName?: unknown;
  customerPhone?: unknown;
  recipientName?: unknown;
  recipientPhone?: unknown;
  deliveryAddress?: unknown;
  deliveryLatitude?: unknown;
  deliveryLongitude?: unknown;
  deliveryZoneId?: unknown;
  items?: unknown;
}): Promise<ToolResponse> {
  try {
    const draftRepository = new PostgresOrderDraftRepository();
    const draftId = validateString(params.draftId);
    
    if (!draftId) {
      return {
        status: "error",
        message: "Draft ID не указан",
      };
    }

    const updates: UpdateOrderDraftInput = {
      conversationState: params.conversationState as any,
      customerName: validateString(params.customerName),
      customerPhone: validatePhone(params.customerPhone),
      recipientName: validateString(params.recipientName),
      recipientPhone: validatePhone(params.recipientPhone),
      deliveryAddress: validateString(params.deliveryAddress),
      deliveryLatitude: Number.isFinite(Number(params.deliveryLatitude)) ? Number(params.deliveryLatitude) : undefined,
      deliveryLongitude: Number.isFinite(Number(params.deliveryLongitude)) ? Number(params.deliveryLongitude) : undefined,
      deliveryZoneId: validateString(params.deliveryZoneId),
      items: Array.isArray(params.items) ? params.items : undefined,
    };

    const updated = await draftRepository.update(draftId, updates);
    if (!updated) {
      return {
        status: "error",
        message: "Черновик не найден",
      };
    }

    return {
      status: "ok",
      data: updated,
    };
  } catch (error) {
    console.error("[ai-tools] update_draft error:", error);
    return {
      status: "error",
      message: "Ошибка при обновлении черновика",
    };
  }
}

// ==================================================
// TOOL: get_draft_summary
// Retrieve draft summary for order confirmation
// ==================================================
async function getDraftSummary(params: {
  draftId?: unknown;
}): Promise<ToolResponse> {
  try {
    const draftRepository = new PostgresOrderDraftRepository();
    const draftId = validateString(params.draftId);
    
    if (!draftId) {
      return {
        status: "error",
        message: "Draft ID не указан",
      };
    }

    const draft = await draftRepository.findById(draftId);
    if (!draft) {
      return {
        status: "error",
        message: "Черновик не найден",
      };
    }

    // Calculate total from items
    const total = draft.items?.reduce((sum, item: any) => {
      return sum + ((item.price || 0) * (item.quantity || 1));
    }, 0) || 0;

    return {
      status: "ok",
      data: {
        draftId: draft.id,
        status: draft.status,
        customer: {
          name: draft.customerName,
          phone: draft.customerPhone,
        },
        recipient: {
          name: draft.recipientName,
          phone: draft.recipientPhone,
        },
        delivery: {
          address: draft.deliveryAddress,
          latitude: draft.deliveryLatitude,
          longitude: draft.deliveryLongitude,
          zoneId: draft.deliveryZoneId,
        },
        items: draft.items || [],
        total,
        conversationTurns: draft.conversationState?.turns?.length || 0,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
      },
    };
  } catch (error) {
    console.error("[ai-tools] get_draft_summary error:", error);
    return {
      status: "error",
      message: "Ошибка при загрузке сводки черновика",
    };
  }
}


// ==================================================
// TOOL: validate_product_availability
// Validate that products are still available in catalog
// ==================================================
async function validateProductAvailability(params: {
  productIds?: unknown;
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
    const productIds = Array.isArray(params.productIds) ? params.productIds : [];

    if (productIds.length === 0) {
      return {
        status: "error",
        message: "Список ID товаров не указан",
      };
    }

    const results = productIds.map((id: any) => {
      const product = products.find((p: CatalogProduct) => p.id === id);
      return {
        id,
        available: !!product,
        product: product ? {
          id: product.id,
          title: product.title,
          priceRub: product.priceRub,
          availability: product.availability,
        } : null,
      };
    });

    const allAvailable = results.every((r: any) => r.available);

    return {
      status: "ok",
      data: {
        allAvailable,
        results,
      },
    };
  } catch (error) {
    console.error("[ai-tools] validate_product_availability error:", error);
    return {
      status: "error",
      message: "Ошибка при проверке доступности товаров",
    };
  }
}

// ==================================================
// TOOL: finalize_order_from_draft
// Convert a draft to a confirmed order
// ==================================================
// TOOL: finalize_order_from_draft
// Creates a REAL ORDER from the draft by calling the Orders service
// Uses idempotency key to prevent duplicate orders on retry
// ==================================================
async function finalizeOrderFromDraft(params: {
  draftId?: unknown;
}): Promise<ToolResponse> {
  try {
    const draftRepository = new PostgresOrderDraftRepository();
    const draftId = validateString(params.draftId);

    if (!draftId) {
      return {
        status: "error",
        message: "Draft ID не указан",
      };
    }

    const draft = await draftRepository.findById(draftId);
    if (!draft) {
      return {
        status: "error",
        message: "Черновик не найден",
      };
    }

    // === STRICT VALIDATION: Trim and validate all string fields ===
    const customerName = draft.customerName?.trim();
    const customerPhone = draft.customerPhone?.trim();
    const recipientName = draft.recipientName?.trim();
    const deliveryAddress = draft.deliveryAddress?.trim();
    const deliveryDate = draft.deliveryDate?.trim();
    const deliveryInterval = draft.deliveryInterval?.trim();

    // Validate draft is complete with all required fields
    if (!customerName || !customerPhone ||
        !recipientName || !deliveryAddress ||
        !deliveryDate || !deliveryInterval ||
        !draft.items || draft.items.length === 0) {
      return {
        status: "error",
        message: "Черновик неполный. Заполните все обязательные поля.",
      };
    }

    // === CRITICAL VALIDATION: Validate coordinates are present and valid ===
    // NEVER substitute 0,0. If coordinates missing, return error.
    if (draft.deliveryLatitude === undefined || draft.deliveryLatitude === null ||
        draft.deliveryLongitude === undefined || draft.deliveryLongitude === null) {
      return {
        status: "error",
        message: "Координаты доставки не установлены. Используйте поиск адреса.",
      };
    }

    const lat = Number(draft.deliveryLatitude);
    const lon = Number(draft.deliveryLongitude);

    // Reject exactly 0,0 (placeholder)
    if (lat === 0 && lon === 0) {
      return {
        status: "error",
        message: "Координаты доставки некорректны. Используйте поиск адреса.",
      };
    }

    // Validate geographic bounds
    if (Math.abs(lat) > 85 || Math.abs(lon) > 180) {
      return {
        status: "error",
        message: "Координаты доставки вне допустимого диапазона.",
      };
    }

    // === ITEM VALIDATION: Validate each item has required fields ===
    for (let i = 0; i < draft.items.length; i++) {
      const item = draft.items[i];
      
      if (!item.productId) {
        return {
          status: "error",
          message: `Товар ${i + 1}: не указан ID товара.`,
        };
      }

      if (!item.size) {
        return {
          status: "error",
          message: `Товар ${i + 1}: не указан размер.`,
        };
      }

      const qty = Math.max(1, parseInt(String(item.quantity || 1)));
      if (qty < 1) {
        return {
          status: "error",
          message: `Товар ${i + 1}: количество должно быть не менее 1.`,
        };
      }
    }

    // Validate product availability before finalizing
    const productIds = Array.isArray(draft.items)
      ? draft.items.map((item: any) => item.id || item.productId)
      : [];

    const availCheck = await validateProductAvailability({ productIds });
    if (availCheck.status !== "ok" || !(availCheck.data as any).allAvailable) {
      return {
        status: "error",
        message: "Некоторые товары недоступны. Пожалуйста, выберите другие.",
      };
    }

    // Create order service with dependencies
    const orderService = createOrderService({
      catalog: new PostgresOrderCatalogGateway(),
      repository: new PostgresOrderRepository(),
    });

    // Generate idempotency key based on draft (phone + draftId)
    // This ensures same result if finalize is called multiple times
    const idempotencyKeyInput = `${customerPhone}:${draftId}`;
    const idempotencyKey = createHash("sha256").update(idempotencyKeyInput).digest("hex");

    // Create CreateOrderInput from draft data
    // CRITICAL: Use validated coordinates, NEVER 0,0
    const createOrderInput: CreateOrderInput = {
      customerName,
      customerPhone,
      recipientName,
      recipientPhone: draft.recipientPhone?.trim() || customerPhone,
      deliveryAddress,
      deliveryLatitude: lat,
      deliveryLongitude: lon,
      deliveryDate,
      deliveryInterval,
      paymentMethod: draft.paymentMethod || "cardTransfer",
      customerComment: draft.customerComment?.trim() || "",
      items: draft.items.map((item: any) => ({
        productId: item.productId,
        size: item.size || "M",
        quantity: Math.max(1, parseInt(String(item.quantity || 1))),
      })),
    };

    // Call the order service to create a REAL order
    // This will handle validation, price calculation, and persistence
    const result = await orderService.create(createOrderInput, idempotencyKey);

    // If order was replayed (idempotency key already existed), just return it
    const isNewOrder = !result.replayed;

    // Mark draft as converted with the real order ID
    if (isNewOrder) {
      await draftRepository.markAsConverted(draftId, result.order.id);
    }

    return {
      status: "ok",
      data: {
        success: true,
        draftId,
        message: isNewOrder ? "Заказ успешно создан" : "Заказ уже был создан",
        orderId: result.order.id,
        orderNumber: result.order.publicNumber,
        replayed: result.replayed,
        order: {
          id: result.order.id,
          publicNumber: result.order.publicNumber,
          status: result.order.status,
          total: result.order.total,
          items: result.order.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            size: item.size,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
          })),
        },
      },
    };
  } catch (error) {
    console.error("[ai-tools] finalize_order_from_draft error:", error);

    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error("[ai-tools] Error details:", error.message, error.stack);
    }

    return {
      status: "error",
      message: error instanceof Error ? error.message : "Ошибка при подтверждении заказа",
    };
  }
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
      case "update_draft":
        result = await updateDraft(params);
        break;
      case "get_draft_summary":
        result = await getDraftSummary(params);
        break;
      case "validate_product_availability":
        result = await validateProductAvailability(params);
        break;
      case "finalize_order_from_draft":
        result = await finalizeOrderFromDraft(params);
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
