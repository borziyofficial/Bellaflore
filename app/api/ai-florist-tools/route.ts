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
const SEARCH_STOP_WORDS = new Set([
  "букет",
  "букеты",
  "цветок",
  "цветы",
  "цветов",
  "мне",
  "нужен",
  "нужны",
  "хочу",
  "покажи",
  "подбери",
  "примерно",
]);

function normalizeSearchToken(rawToken: string): string {
  let token = rawToken
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/gi, "");

  if (!token || SEARCH_STOP_WORDS.has(token)) {
    return "";
  }

  // Lightweight Russian morphology normalization for catalog retrieval.
  // Examples:
  // красные/красных/красными -> красн
  // розы/розами -> роз
  // корзина/корзины -> корзин
  const suffixes = [
    "иями", "ями", "ами", "ыми", "ими",
    "ого", "ему", "ому", "ыми", "ими",
    "ая", "яя", "ое", "ее", "ые", "ие",
    "ый", "ий", "ой", "ую", "юю",
    "ов", "ев", "ей", "ам", "ям", "ах", "ях",
    "а", "я", "ы", "и", "у", "ю", "е", "о",
  ];

  for (const suffix of suffixes) {
    if (token.endsWith(suffix) && token.length - suffix.length >= 3) {
      token = token.slice(0, -suffix.length);
      break;
    }
  }

  return token;
}

function tokenizeSearchText(value: string): string[] {
  return [
    ...new Set(
      value
        .toLowerCase()
        .replace(/ё/g, "е")
        .split(/[^a-zа-я0-9]+/gi)
        .map(normalizeSearchToken)
        .filter((token) => token.length >= 3),
    ),
  ];
}

function searchTokenMatches(candidateToken: string, requestedToken: string): boolean {
  if (candidateToken === requestedToken) {
    return true;
  }

  // Allow close Russian word forms after lightweight stemming, but avoid
  // very short-prefix matches that would produce noisy recommendations.
  const shorter = candidateToken.length <= requestedToken.length
    ? candidateToken
    : requestedToken;
  const longer = candidateToken.length > requestedToken.length
    ? candidateToken
    : requestedToken;

  return shorter.length >= 4 && longer.startsWith(shorter);
}

function productSearchText(product: CatalogProduct): string {
  return [
    product.title,
    product.description,
    product.flowerType,
    product.category,
    ...(product.tags || []),
    ...(product.searchTerms || []),
  ]
    .filter(Boolean)
    .join(" ");
}

// ==================================================
// TOOL: search_products
// Semantic-ish catalog search with lightweight Russian morphology.
// Returns exact matches when possible; otherwise only close partial
// alternatives and explicitly marks them as partial for the AI.
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
    const category = validateString(params.category) || "";
    const flowerType = validateString(params.flowerType) || "";

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

    if (minPrice > maxPrice) {
      [minPrice, maxPrice] = [maxPrice, minPrice];
    }

    const limit = Math.min(Math.max(1, Number(params.limit) || 5), 20);

    // Treat query/category/flowerType as semantic constraints over all
    // searchable product metadata. This is intentionally not a literal
    // phrase search: Russian morphology and word order must not hide
    // products that are actually relevant.
    const requestedTerms = tokenizeSearchText(
      [query, category, flowerType].filter(Boolean).join(" "),
    );

    const targetPrice =
      minPrice > 0 && maxPrice < 1_000_000
        ? (minPrice + maxPrice) / 2
        : maxPrice < 1_000_000
          ? maxPrice
          : minPrice > 0
            ? minPrice
            : null;

    const scored = products
      .filter(
        (product: CatalogProduct) =>
          product.priceRub >= minPrice && product.priceRub <= maxPrice,
      )
      .map((product: CatalogProduct) => {
        const candidateTokens = tokenizeSearchText(productSearchText(product));
        const matchedTerms = requestedTerms.filter((requestedToken) =>
          candidateTokens.some((candidateToken) =>
            searchTokenMatches(candidateToken, requestedToken),
          ),
        );
        const missingTerms = requestedTerms.filter(
          (requestedToken) => !matchedTerms.includes(requestedToken),
        );

        const titleTokens = tokenizeSearchText(product.title || "");
        const titleMatchCount = matchedTerms.filter((requestedToken) =>
          titleTokens.some((titleToken) =>
            searchTokenMatches(titleToken, requestedToken),
          ),
        ).length;

        return {
          product,
          matchedTerms,
          missingTerms,
          semanticScore: matchedTerms.length * 10 + titleMatchCount * 4,
        };
      });

    const exactMatches =
      requestedTerms.length === 0
        ? scored
        : scored.filter((entry) => entry.missingTerms.length === 0);

    const minimumPartialMatches =
      requestedTerms.length <= 1
        ? 1
        : Math.ceil(requestedTerms.length * 0.6);

    const partialMatches =
      requestedTerms.length === 0 || exactMatches.length > 0
        ? []
        : scored.filter(
            (entry) => entry.matchedTerms.length >= minimumPartialMatches,
          );

    const matchMode =
      requestedTerms.length === 0
        ? "all"
        : exactMatches.length > 0
          ? "exact"
          : partialMatches.length > 0
            ? "partial"
            : "none";

    const selected =
      matchMode === "exact" || matchMode === "all"
        ? exactMatches
        : matchMode === "partial"
          ? partialMatches
          : [];

    selected.sort((a, b) => {
      if (b.semanticScore !== a.semanticScore) {
        return b.semanticScore - a.semanticScore;
      }

      const popularityDiff =
        (b.product.isPopular ? 1 : 0) - (a.product.isPopular ? 1 : 0);
      if (popularityDiff !== 0) {
        return popularityDiff;
      }

      if (targetPrice !== null) {
        return (
          Math.abs(a.product.priceRub - targetPrice) -
          Math.abs(b.product.priceRub - targetPrice)
        );
      }

      return a.product.priceRub - b.product.priceRub;
    });

    const results = selected.slice(0, limit).map((entry) => ({
      id: entry.product.id,
      slug: entry.product.slug || entry.product.id,
      title: entry.product.title,
      description: entry.product.description,
      priceRub: entry.product.priceRub,
      flowerType: entry.product.flowerType,
      category: entry.product.category,
      tags: entry.product.tags,
      image: entry.product.src,
      availability: entry.product.availability,
      matchQuality: matchMode,
      matchedTerms: entry.matchedTerms,
      missingTerms: entry.missingTerms,
    }));

    return {
      status: "ok",
      data: {
        products: results,
        count: results.length,
        totalAvailable: selected.length,
        matchMode,
        requestedTerms,
        budget: {
          minPrice: minPrice > 0 ? minPrice : null,
          maxPrice: maxPrice < 1_000_000 ? maxPrice : null,
        },
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
  const address = validateString(params.address);

  if (!address) {
    return {
      status: "error",
      message: "Адрес не указан",
    };
  }

  // Apartment / entrance / floor are delivery details, not geocoding input.
  // Keep the original address for the order, but geocode only street + house.
  const geocodeAddress = address
    .split(",")
    .map((part) => part.trim())
    .filter(
      (part) =>
        part &&
        !/(?:^|\s)(?:кв(?:артира)?\.?|подъезд|этаж|домофон|офис)\b/i.test(part),
    )
    .join(", ");

  const siteBaseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const manualReview = (reason: string): ToolResponse => ({
    status: "ok",
    data: {
      address,
      geocodeAddress,
      validated: false,
      manualReview: true,
      reason,
      message:
        "Адрес сохранён. Геокодер не подтвердил его автоматически; продолжайте оформление без запроса метро или ориентира.",
    },
  });

  try {
    const geocodeUrl = new URL(`${siteBaseUrl}/api/yandex-geocode`);
    geocodeUrl.searchParams.set("geocode", geocodeAddress);

    const response = await fetch(geocodeUrl.toString(), {
      headers: {
        Accept: "application/json",
        Referer: `${siteBaseUrl}/ai-consultant`,
        Origin: siteBaseUrl,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      return manualReview(`geocoder_http_${response.status}`);
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
      return manualReview("address_not_resolved");
    }

    const first = result.results[0];
    const latitude = first.latitude;
    const longitude = first.longitude;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return manualReview("coordinates_not_resolved");
    }

    return {
      status: "ok",
      data: {
        address,
        geocodeAddress,
        normalizedAddress: first.formattedAddress || geocodeAddress,
        latitude,
        longitude,
        precision: first.precision,
        validated: true,
        manualReview: false,
      },
    };
  } catch (error) {
    console.error("[ai-tools] validate_address error:", error);
    return manualReview("geocoder_unavailable");
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
  deliveryDate?: unknown;
  deliveryInterval?: unknown;
  customerComment?: unknown;
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
      deliveryDate: validateString(params.deliveryDate),
      deliveryInterval: validateString(params.deliveryInterval),
      customerComment: validateString(params.customerComment),
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

    // Resolve selected draft items against the REAL published catalog.
    // Draft stores only productId/size/quantity; title and price are derived
    // server-side so the Summary never trusts client/AI-provided prices.
    const catalogResult = await loadPublishedStorefrontCatalog();
    if (catalogResult.status !== "success") {
      return {
        status: "error",
        message: "Каталог недоступен",
      };
    }

    const catalogById = new Map(
      catalogResult.products.map((product) => [product.id, product]),
    );

    const summaryItems = (draft.items || []).map((item) => {
      const product = catalogById.get(item.productId);

      const selectedSize =
        product && Array.isArray(product.sizes)
          ? product.sizes.find((size) => size.label === item.size)
          : undefined;

      const price =
        selectedSize?.price ??
        product?.priceRub ??
        0;

      return {
        id: item.productId,
        productId: item.productId,
        title: product?.title || "Товар",
        size: item.size,
        price,
        quantity: item.quantity,
      };
    });

    const total = summaryItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

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
          date: draft.deliveryDate,
          interval: draft.deliveryInterval,
        },
        items: summaryItems,
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
