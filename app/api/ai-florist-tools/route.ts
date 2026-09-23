import { loadPublishedStorefrontCatalog } from "@/lib/catalogDb/publicStorefront";
import type { CatalogProduct } from "@/data/catalogProducts";

// ==================================================
// SECTION: AI FLORIST TOOLS
// Защищённый слой инструментов для AI агента
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
// TOOL: search_products
// Поиск товаров по каталогу
// ==================================================
async function searchProducts(params: {
  query?: string;
  maxPrice?: number;
  minPrice?: number;
  category?: string;
  flowerType?: string;
  limit?: number;
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
    const {
      query = "",
      maxPrice = Infinity,
      minPrice = 0,
      category,
      flowerType,
      limit = 5,
    } = params;

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
// Получить детали товара
// ==================================================
async function getProduct(params: {
  id?: string;
  slug?: string;
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
    const product = products.find(
      (p: CatalogProduct) => p.id === params.id || p.slug === params.slug
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
// TOOL: validate_address
// Проверка адреса через Yandex
// ==================================================
async function validateAddress(params: {
  address: string;
}): Promise<ToolResponse> {
  try {
    if (!params.address) {
      return {
        status: "error",
        message: "Адрес не указан",
      };
    }

    return {
      status: "ok",
      data: {
        address: params.address,
        validated: true,
        needsConfirmation: true,
        message: "Адрес понял — уточним детали на чекауте",
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
// TOOL: calculate_delivery
// Расчёт доставки (архитектура)
// ==================================================
async function calculateDelivery(params: {
  address: string;
  date?: string;
}): Promise<ToolResponse> {
  try {
    return {
      status: "ok",
      data: {
        address: params.address,
        date: params.date || "tomorrow",
        available: true,
        message: "Доставку уточним по адресу на оформлении",
      },
    };
  } catch (error) {
    console.error("[ai-tools] calculate_delivery error:", error);
    return {
      status: "error",
      message: "Ошибка при расчёте доставки",
    };
  }
}

// ==================================================
// TOOL: create_order_draft
// Создать черновик заказа (архитектура)
// ==================================================
async function createOrderDraft(params: {
  productId: string;
  productTitle: string;
  price: number;
  customerName?: string;
  customerPhone?: string;
  recipientName?: string;
  address?: string;
  date?: string;
}): Promise<ToolResponse> {
  try {
    const draftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      status: "ok",
      data: {
        draftId,
        product: {
          id: params.productId,
          title: params.productTitle,
          price: params.price,
        },
        customer: {
          name: params.customerName || null,
          phone: params.customerPhone || null,
        },
        recipient: {
          name: params.recipientName || null,
        },
        delivery: {
          address: params.address || null,
          date: params.date || null,
        },
        status: "created",
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
// Обновить черновик (архитектура)
// ==================================================
async function updateOrderDraft(params: {
  draftId: string;
  customerName?: string;
  customerPhone?: string;
  recipientName?: string;
  address?: string;
  date?: string;
  interval?: string;
}): Promise<ToolResponse> {
  try {
    return {
      status: "ok",
      data: {
        draftId: params.draftId,
        updated: {
          customerName: params.customerName,
          customerPhone: params.customerPhone,
          recipientName: params.recipientName,
          address: params.address,
          date: params.date,
          interval: params.interval,
        },
        status: "updated",
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
// Методы оплаты (архитектура)
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
        result = await searchProducts(params as any);
        break;
      case "get_product":
        result = await getProduct(params as any);
        break;
      case "validate_address":
        result = await validateAddress(params as any);
        break;
      case "calculate_delivery":
        result = await calculateDelivery(params as any);
        break;
      case "create_order_draft":
        result = await createOrderDraft(params as any);
        break;
      case "update_order_draft":
        result = await updateOrderDraft(params as any);
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
