"use server";

type FloristMessage = {
  role: "user" | "assistant" | "tool";
  content: string | any[];
  tool_call_id?: string;
  tool_calls?: any[];
};

type FloristCandidate = {
  id: string;
  title: string;
  priceRub: number;
  category?: string;
  flowerType?: string;
  description?: string;
  tags?: string[];
  sizes?: Array<{ label: string; price: number }>;
};

type FloristRequest = {
  messages?: FloristMessage[];
  candidates?: FloristCandidate[];
  draftId?: string;
};

type FloristIntent =
  | "greeting/general_conversation"
  | "bella_flore_service_question"
  | "flower_care"
  | "delivery_question"
  | "product_question"
  | "florist_advice"
  | "bouquet_selection";

type FloristFallbackReason =
  | "missing_credentials"
  | "invalid_ai_response"
  | "upstream_error"
  | "network_or_timeout";

type FloristReply = {
  reply: string;
  recommendedProductIds?: string[];
  mode: "ai" | "fallback";
  fallbackReason?: FloristFallbackReason;
  modelUsed?: string;
};

const AI_RATE_LIMIT_MAX_REQUESTS = 8;
const AI_RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_TOOL_CALLS = 10;
const SAFE_DIRECT_MODEL = "gpt-5.6-sol";

// Tool definitions for Responses API (flat format, not nested)
const TOOL_DEFINITIONS = [
  {
    type: "function",
    strict: false,
    name: "search_products",
    description:
      "Search real BellaFlore catalog products. Use budget fields for prices; use query only for actual flower/product keywords, never for recipient or occasion.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Optional flower/product/catalog keyword, e.g. 'гортензия' or 'розы'. Omit for generic gift/occasion requests.",
        },
        minPrice: {
          type: "number",
          description: "Minimum product price in RUB when the user gives a lower budget bound.",
        },
        maxPrice: {
          type: "number",
          description: "Maximum product price in RUB when the user gives an upper budget bound.",
        },
        category: {
          type: "string",
          description: "Optional catalog category only when explicitly relevant.",
        },
        flowerType: {
          type: "string",
          description: "Optional flower type only when the user names a flower.",
        },
        limit: { type: "number", description: "Number of results, usually 3-5." },
      },
    },
  },
  {
    type: "function",
    strict: false,
    name: "get_product",
    description: "Get detailed product info",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Product ID" },
      },
      required: ["id"],
    },
  },
  {
    type: "function",
    strict: false,
    name: "update_draft",
    description: "Update order draft with collected data",
    parameters: {
      type: "object",
      properties: {
        draftId: { type: "string" },
        customerName: { type: "string" },
        customerPhone: { type: "string" },
        recipientName: { type: "string" },
        recipientPhone: { type: "string" },
        deliveryAddress: { type: "string" },
        deliveryLatitude: { type: "number" },
        deliveryLongitude: { type: "number" },
        deliveryZoneId: { type: "string" },
        deliveryDate: { type: "string" },
        deliveryInterval: { type: "string" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              productId: { type: "string" },
              size: { type: "string", enum: ["S", "M", "L", "XL"] },
              quantity: { type: "number" },
            },
            required: ["productId", "size", "quantity"],
          },
        },
        customerComment: { type: "string" },
      },
      required: ["draftId"],
    },
  },
  {
    type: "function",
    strict: false,
    name: "validate_address",
    description: "Validate delivery address and get coordinates",
    parameters: {
      type: "object",
      properties: {
        address: { type: "string" },
      },
      required: ["address"],
    },
  },
  {
    type: "function",
    strict: false,
    name: "calculate_delivery",
    description: "Calculate delivery cost and zone",
    parameters: {
      type: "object",
      properties: {
        latitude: { type: "number" },
        longitude: { type: "number" },
      },
      required: ["latitude", "longitude"],
    },
  },
  {
    type: "function",
    strict: false,
    name: "get_draft_summary",
    description: "Get current draft summary with all collected data",
    parameters: {
      type: "object",
      properties: {
        draftId: { type: "string" },
      },
      required: ["draftId"],
    },
  },
  {
    type: "function",
    strict: false,
    name: "validate_product_availability",
    description: "Check if selected products are available",
    parameters: {
      type: "object",
      properties: {
        productIds: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["productIds"],
    },
  },
];

const requestBuckets = new Map<string, { count: number; resetAt: number }>();

function requestIdentity(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "anonymous";
}

function consumeRequestQuota(request: Request): Response | null {
  const key = requestIdentity(request);
  const now = Date.now();
  const current = requestBuckets.get(key);

  if (!current || current.resetAt <= now) {
    requestBuckets.set(key, {
      count: 1,
      resetAt: now + AI_RATE_LIMIT_WINDOW_MS,
    });
    return null;
  }

  if (current.count >= AI_RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000),
    );
    return Response.json(
      { message: "Слишком много сообщений. Попробуйте немного позже." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds) },
      },
    );
  }

  current.count += 1;
  requestBuckets.set(key, current);
  return null;
}

async function executeTool(toolName: string, toolInput: Record<string, any>): Promise<string> {
  try {
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/ai-florist-tools`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: toolName,
        params: toolInput,
      }),
    });

    if (!response.ok) {
      return JSON.stringify({ status: "error", message: `Tool execution failed: ${toolName}` });
    }

    const result = await response.json();
    return JSON.stringify(result);
  } catch (error) {
    return JSON.stringify({ status: "error", message: `Tool error: ${String(error)}` });
  }
}


type BudgetRange = {
  minPrice?: number;
  maxPrice?: number;
};

type VerifiedCatalogProduct = {
  id: string;
  title: string;
  priceRub: number;
  matchQuality?: "exact" | "partial" | "all" | "none";
  matchedTerms?: string[];
  missingTerms?: string[];
};

function parseBudgetAmount(raw: string, useThousands: boolean): number | undefined {
  const normalized = Number(raw.replace(",", "."));
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return undefined;
  }

  const scaled = useThousands && normalized <= 100 ? normalized * 1000 : normalized;
  return Math.round(scaled);
}

function inferBudgetRange(messages: FloristMessage[]): BudgetRange | null {
  const recentText = messages
    .slice(-8)
    .map((message) =>
      typeof message.content === "string" ? message.content.toLowerCase() : "",
    )
    .join(" ");

  const useThousands = /\bтыс(?:\.|яч(?:а|и|у|е|ей)?)?\b/i.test(recentText);

  const userTexts = messages
    .filter((message) => message.role === "user" && typeof message.content === "string")
    .map((message) => String(message.content).toLowerCase())
    .reverse();

  for (const text of userTexts) {
    const rangeMatch = text.match(
      /(\d+(?:[.,]\d+)?)\s*(?:-|–|—|до)\s*(\d+(?:[.,]\d+)?)/,
    );
    if (rangeMatch) {
      const minPrice = parseBudgetAmount(rangeMatch[1], useThousands);
      const maxPrice = parseBudgetAmount(rangeMatch[2], useThousands);
      if (minPrice && maxPrice) {
        return {
          minPrice: Math.min(minPrice, maxPrice),
          maxPrice: Math.max(minPrice, maxPrice),
        };
      }
    }

    const maxMatch = text.match(/(?:до|за|бюджет(?:ом)?\s*(?:до)?|примерно)\s*(\d+(?:[.,]\d+)?)/);
    if (maxMatch) {
      const maxPrice = parseBudgetAmount(maxMatch[1], useThousands);
      if (maxPrice) {
        return { maxPrice };
      }
    }

    const minMatch = text.match(/(?:от)\s*(\d+(?:[.,]\d+)?)/);
    if (minMatch) {
      const minPrice = parseBudgetAmount(minMatch[1], useThousands);
      if (minPrice) {
        return { minPrice };
      }
    }

    const shortBudgetMatch = text.match(/^\s*(?:а\s+)?за\s+(\d+(?:[.,]\d+)?)\s*\??\s*$/);
    if (shortBudgetMatch) {
      const maxPrice = parseBudgetAmount(shortBudgetMatch[1], useThousands);
      if (maxPrice) {
        return { maxPrice };
      }
    }
  }

  return null;
}

function looksLikeNoProductsReply(reply: string): boolean {
  const normalized = reply.toLowerCase();
  return (
    /ничего\s+не\s+наш/.test(normalized) ||
    /не\s+нашл/.test(normalized) ||
    /нет\s+подходящ/.test(normalized) ||
    /подходящих\s+букетов.*нет/.test(normalized) ||
    /вариантов.*нет/.test(normalized)
  );
}

async function verifyBudgetCatalogBeforeNoResults(
  messages: FloristMessage[],
  lastSearchArgs?: Record<string, any> | null,
): Promise<{
  products: VerifiedCatalogProduct[];
  exactRangeEmpty: boolean;
  semanticPartial: boolean;
  range: BudgetRange;
} | null> {
  const inferredRange = inferBudgetRange(messages);
  const range: BudgetRange = {
    minPrice:
      typeof lastSearchArgs?.minPrice === "number"
        ? lastSearchArgs.minPrice
        : inferredRange?.minPrice,
    maxPrice:
      typeof lastSearchArgs?.maxPrice === "number"
        ? lastSearchArgs.maxPrice
        : inferredRange?.maxPrice,
  };

  if (!range.minPrice && !range.maxPrice) {
    return null;
  }

  // Preserve the model's actual semantic constraints. The previous safety
  // net incorrectly dropped query/category/flowerType and could recommend
  // unrelated products merely because they fit the price.
  const semanticArgs = {
    ...(typeof lastSearchArgs?.query === "string" && lastSearchArgs.query.trim()
      ? { query: lastSearchArgs.query.trim() }
      : {}),
    ...(typeof lastSearchArgs?.category === "string" && lastSearchArgs.category.trim()
      ? { category: lastSearchArgs.category.trim() }
      : {}),
    ...(typeof lastSearchArgs?.flowerType === "string" && lastSearchArgs.flowerType.trim()
      ? { flowerType: lastSearchArgs.flowerType.trim() }
      : {}),
  };

  const primaryResultText = await executeTool("search_products", {
    ...semanticArgs,
    ...(range.minPrice ? { minPrice: range.minPrice } : {}),
    ...(range.maxPrice ? { maxPrice: range.maxPrice } : {}),
    limit: 5,
  });

  try {
    const primaryResult = JSON.parse(primaryResultText);
    const primaryProducts = Array.isArray(primaryResult?.data?.products)
      ? (primaryResult.data.products as VerifiedCatalogProduct[])
      : [];
    const primaryMatchMode = primaryResult?.data?.matchMode;

    if (primaryProducts.length > 0) {
      return {
        products: primaryProducts,
        exactRangeEmpty: false,
        semanticPartial: primaryMatchMode === "partial",
        range,
      };
    }

    // If the user's requested range is empty, try cheaper products while
    // KEEPING the same semantic request. We may relax price, never meaning.
    if (range.minPrice && range.maxPrice) {
      const cheaperResultText = await executeTool("search_products", {
        ...semanticArgs,
        maxPrice: range.maxPrice,
        limit: 5,
      });
      const cheaperResult = JSON.parse(cheaperResultText);
      const cheaperProducts = Array.isArray(cheaperResult?.data?.products)
        ? (cheaperResult.data.products as VerifiedCatalogProduct[])
        : [];
      const cheaperMatchMode = cheaperResult?.data?.matchMode;

      if (cheaperProducts.length > 0) {
        return {
          products: cheaperProducts,
          exactRangeEmpty: true,
          semanticPartial: cheaperMatchMode === "partial",
          range,
        };
      }
    }
  } catch (error) {
    console.error("[ai-florist] budget verification parse error:", error);
  }

  return null;
}

function formatVerifiedProductsReply(
  verification: {
    products: VerifiedCatalogProduct[];
    exactRangeEmpty: boolean;
    semanticPartial: boolean;
    range: BudgetRange;
  },
): string {
  const options = verification.products
    .slice(0, 3)
    .map((product) => `${product.title} — ${product.priceRub.toLocaleString("ru-RU")} ₽`)
    .join("; ");

  if (verification.semanticPartial) {
    return `Точного совпадения с вашим запросом сейчас не нашёл. Ближайшие реальные варианты: ${options}. Показать подробнее или сохранить ключевое условие и поискать другой вариант?`;
  }

  if (
    verification.exactRangeEmpty &&
    verification.range.minPrice &&
    verification.range.maxPrice
  ) {
    return `В диапазоне ${verification.range.minPrice.toLocaleString("ru-RU")}–${verification.range.maxPrice.toLocaleString("ru-RU")} ₽ точного варианта сейчас нет, но есть подходящие дешевле: ${options}. Показать один из них?`;
  }

  return `Нашёл реальные варианты по вашему запросу: ${options}. Какой показать подробнее?`;
}

export async function POST(request: Request) {
  const limited = consumeRequestQuota(request);
  if (limited) return limited;

  let body: FloristRequest;

  try {
    body = (await request.json()) as FloristRequest;
  } catch {
    return Response.json(
      { message: "Некорректный запрос." },
      { status: 400 },
    );
  }

  const messages = Array.isArray(body.messages)
    ? body.messages
        .filter(
          (message): message is FloristMessage =>
            Boolean(
              message &&
                (message.role === "user" || message.role === "assistant") &&
                (typeof message.content === "string" ||
                  Array.isArray(message.content)) &&
                (typeof message.content === "string" ? message.content.trim() : message.content.length > 0),
            ),
        )
        .map((message) => ({
          ...message,
          content: typeof message.content === "string"
            ? message.content.trim().slice(0, MAX_MESSAGE_LENGTH)
            : message.content,
        }))
        .slice(-12)
    : [];

  if (messages.length === 0) {
    return Response.json(
      { message: "Сообщение не найдено." },
      { status: 400 },
    );
  }

  const openAiApiKey = process.env.OPENAI_API_KEY?.trim();

  if (!openAiApiKey) {
    console.info("[ai-florist] mode=fallback reason=missing_credentials");
    return Response.json({
      reply: "Сервис временно недоступен.",
      recommendedProductIds: [],
      mode: "fallback",
      fallbackReason: "missing_credentials",
    } satisfies FloristReply);
  }

  let draftContext =
    "Активный черновик пока недоступен. Используй историю диалога и не повторяй уже известные данные.";
  let draftSummaryData: any = null;

  if (body.draftId) {
    try {
      const summaryRaw = await executeTool("get_draft_summary", {
        draftId: body.draftId,
      });
      const summary = JSON.parse(summaryRaw);

      if (summary?.status === "ok" && summary.data) {
        draftSummaryData = summary.data;
        draftContext = JSON.stringify(summary.data, null, 2);
      }
    } catch (error) {
      console.error("[ai-florist] failed to load draft context:", error);
    }
  }

  if (body.draftId && draftSummaryData) {
    const selectedItems = Array.isArray(draftSummaryData.items)
      ? draftSummaryData.items
      : [];

    const hasSelectedProduct = selectedItems.length > 0;
    const hasCustomerContact = Boolean(
      draftSummaryData.customer?.name &&
      draftSummaryData.customer?.phone,
    );
    const hasRecipientContact = Boolean(
      draftSummaryData.recipient?.name &&
      draftSummaryData.recipient?.phone,
    );
    const hasContact = hasCustomerContact || hasRecipientContact;
    const hasAddress = Boolean(draftSummaryData.delivery?.address);
    const hasDate = Boolean(draftSummaryData.delivery?.date);
    const hasInterval = Boolean(draftSummaryData.delivery?.interval);

    const selectedProductIds = selectedItems
      .map((item: any) => item?.productId || item?.id)
      .filter((id: unknown): id is string => typeof id === "string")
      .slice(0, 3);

    // Deterministic checkout progression:
    // once product + contact + address are known, never send the customer
    // backwards to bouquet selection or repeat contact/address questions.
    if (hasSelectedProduct && hasContact && hasAddress && !hasDate) {
      return Response.json({
        reply: "На какую дату нужна доставка — сегодня, завтра или на другую дату?",
        recommendedProductIds: selectedProductIds,
        mode: "ai",
        modelUsed: SAFE_DIRECT_MODEL,
      } satisfies FloristReply);
    }

    if (
      hasSelectedProduct &&
      hasContact &&
      hasAddress &&
      hasDate &&
      !hasInterval
    ) {
      return Response.json({
        reply: "Какой интервал доставки удобен: 09–12, 12–15, 15–18 или 18–21?",
        recommendedProductIds: selectedProductIds,
        mode: "ai",
        modelUsed: SAFE_DIRECT_MODEL,
      } satisfies FloristReply);
    }
  }

  const systemPrompt = `Ты — AI-флорист BellaFlore, премиального цветочного магазина в Москве.
Общайся естественно и коротко, как опытный живой консультант.

ТЕКУЩЕЕ СОСТОЯНИЕ ЗАКАЗА — ЭТО ИСТОЧНИК ИСТИНЫ:
${draftContext}

Используй инструменты для:
- Поиска букетов (search_products)
- Получения деталей (get_product)
- Проверки адреса (validate_address)
- Расчета доставки (calculate_delivery)
- Сохранения данных в черновик (update_draft)

ВАЖНЫЕ ПРАВИЛА:
1. Собирай постепенно: имя, телефон, адрес, дату, выбор букетов.
2. Используй update_draft чтобы сохранять собранные данные.
3. Никогда не выдумывай цены или товары.
4. Рекомендуй только товары из search_products результатов.
5. Никогда не подставляй координаты 0,0. Если клиент не указал улицу или дом — попроси уточнить. Если улица и дом уже указаны, но геокодер временно не подтвердил адрес, сохрани полный адрес для ручной проверки и продолжай оформление без запроса метро или ориентира.
6. НЕ вызывай finalize_order_from_draft — это вызывает пользователь кнопкой Confirm.
7. Бюджет трактуй точно:
   - "6–7 тысяч" / "от 6000 до 7000" => search_products с minPrice=6000 и maxPrice=7000.
   - "до 7000" => только maxPrice=7000.
   - "от 6000" => только minPrice=6000.
8. Поле query используй ТОЛЬКО для реального названия цветка/товара/категории. Не передавай туда "знакомому", "маме", "без повода", "на день рождения" и подобные слова.
9. Если в приблизительном диапазоне (например 6000–7000) ничего не найдено, не говори "до 7000 ничего нет". Скажи честно, что нет именно В ЭТОМ ДИАПАЗОНЕ, затем сделай второй search_products до верхней границы без minPrice, СОХРАНИВ требования к цветку/цвету/форме композиции.
10. Никогда не утверждай, что "до X ничего нет", если не выполнялся поиск от 0 до X с сохранением смысловых требований клиента.
11. Для товарных требований передавай в query ключевые свойства вместе: например "корзина красные розы". Русские формы и порядок слов обработает поиск.
12. Если search_products возвращает matchMode="partial", это НЕ точное совпадение. Честно скажи, что точного варианта нет, и представь товары только как ближайшие альтернативы.
13. Не предлагай клиенту повышать бюджет, пока не проверены релевантные варианты в его бюджете и дешевле.
14. НИКОГДА не спрашивай повторно данные, которые уже есть в ТЕКУЩЕМ СОСТОЯНИИ ЗАКАЗА или явно были сообщены клиентом.
15. Если клиент одним сообщением дал несколько данных — имя, телефон, адрес, дату, интервал — извлеки и сохрани ВСЕ сразу одним update_draft.
16. Если товар и размер уже выбраны, не повторяй их в каждом ответе. Просто переходи к следующему отсутствующему полю.
17. После выбора товара и размера следующий вопрос должен быть коротким: "Укажите, пожалуйста, имя и телефон получателя, а также адрес доставки." Не добавляй длинных объяснений.
18. Адрес проверяй только по геокодируемой части: город + улица + дом. Подъезд, этаж и квартира — это детали доставки, а НЕ причина повторно проверять улицу и дом.
19. Если клиент написал "Москва, Палехская улица, 15, подъезд 2, этаж 8, квартира 66", для validate_address передай только "Москва, Палехская улица, 15", а в deliveryAddress сохрани полный адрес со всеми деталями.
20. Если validate_address не смог подтвердить адрес, НЕ проси метро, ориентир или дополнительные объяснения, если клиент уже указал город, улицу и дом. Сохрани адрес для ручной проверки и продолжай оформление.
21. Если координаты адреса уже сохранены в черновике, не вызывай validate_address повторно, пока клиент не изменил улицу или дом.
22. После имени/телефона/адреса спроси только дату доставки. После даты — только интервал. Не возвращайся назад к уже заполненным данным.
23. После получения интервала дай короткое резюме и попроси подтвердить переход к оформлению. Не создавай заказ самостоятельно.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 28_000);

    // Responses API: send conversation messages as message inputs.
    const conversationInput = messages.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content:
        typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content),
    }));

    let nextInput: any[] = conversationInput;
    let previousResponseId: string | undefined;
    let toolCallCount = 0;
    const recommendedProductIds: string[] = [];
    let lastSearchArgs: Record<string, any> | null = null;
    let lastSearchResult: any = null;

    for (toolCallCount = 0; toolCallCount < MAX_TOOL_CALLS; toolCallCount++) {
      const requestPayload: Record<string, any> = {
        model: SAFE_DIRECT_MODEL,
        instructions: systemPrompt,
        input: nextInput,
        tools: TOOL_DEFINITIONS,
        tool_choice: "auto",
      };

      if (previousResponseId) {
        requestPayload.previous_response_id = previousResponseId;
      }

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });

      if (!response.ok) {
        clearTimeout(timeout);
        const errorText = await response.text();
        let errorDetails = "Unknown error";
        try {
          const errorJson = JSON.parse(errorText);
          const type = errorJson.error?.type || "unknown";
          const code = errorJson.error?.code || "unknown";
          const message = errorJson.error?.message || "";
          errorDetails = `${type} [${code}]: ${message}`;
        } catch {
          errorDetails = errorText.slice(0, 300);
        }
        console.error("[ai-florist] Responses API error", {
          status: response.status,
          error: errorDetails.slice(0, 700),
        });
        return Response.json({
          reply: "Ошибка при обработке запроса.",
          recommendedProductIds: [],
          mode: "fallback",
          fallbackReason: "upstream_error",
        } satisfies FloristReply);
      }

      const responseData = (await response.json()) as any;
      const output = Array.isArray(responseData.output) ? responseData.output : [];

      if (!responseData.id || output.length === 0) {
        clearTimeout(timeout);
        console.error("[ai-florist] Invalid response format");
        return Response.json({
          reply: "Не удалось обработать запрос.",
          recommendedProductIds: [],
          mode: "fallback",
          fallbackReason: "invalid_ai_response",
        } satisfies FloristReply);
      }

      const toolCallsToExecute: Array<{
        call_id: string;
        name: string;
        arguments: Record<string, any>;
      }> = [];
      const textParts: string[] = [];

      for (const item of output) {
        if (item?.type === "message" && Array.isArray(item.content)) {
          for (const contentItem of item.content) {
            if (
              contentItem?.type === "output_text" &&
              typeof contentItem.text === "string"
            ) {
              textParts.push(contentItem.text);
            }
          }
        } else if (item?.type === "function_call") {
          let args: Record<string, any> = {};
          if (typeof item.arguments === "string") {
            try {
              args = JSON.parse(item.arguments);
            } catch {
              args = {};
            }
          } else if (item.arguments && typeof item.arguments === "object") {
            args = item.arguments;
          }

          toolCallsToExecute.push({
            call_id: item.call_id,
            name: item.name,
            arguments: args,
          });
        }
      }

      if (toolCallsToExecute.length === 0) {
        clearTimeout(timeout);
        const finalReply =
          textParts.join("\n").trim() || "Я готов помочь подобрать букет.";
        let finalRecommendedProductIds = [...new Set(recommendedProductIds)].slice(0, 3);

        // SALES SAFETY NET:
        // A model must not turn a buyer away with a false "nothing available"
        // statement. If a budget is present and no products were recommended,
        // re-check the real catalog server-side without recipient/occasion
        // text filters. Real catalog data wins over model wording.
        if (
          finalRecommendedProductIds.length === 0 &&
          looksLikeNoProductsReply(finalReply)
        ) {
          // First trust any real products already returned by the latest
          // catalog search. If the model ignored them, surface them instead
          // of allowing a false "nothing available" response.
          const searchedProducts = Array.isArray(lastSearchResult?.data?.products)
            ? (lastSearchResult.data.products as VerifiedCatalogProduct[])
            : [];

          if (searchedProducts.length > 0) {
            const verification = {
              products: searchedProducts,
              exactRangeEmpty: false,
              semanticPartial: lastSearchResult?.data?.matchMode === "partial",
              range: inferBudgetRange(messages) ?? {},
            };

            finalRecommendedProductIds = searchedProducts
              .slice(0, 3)
              .map((product) => product.id);

            return Response.json({
              reply: formatVerifiedProductsReply(verification),
              recommendedProductIds: finalRecommendedProductIds,
              mode: "ai",
              modelUsed:
                typeof responseData.model === "string"
                  ? responseData.model
                  : SAFE_DIRECT_MODEL,
            } satisfies FloristReply);
          }

          const verification = await verifyBudgetCatalogBeforeNoResults(
            messages,
            lastSearchArgs,
          );
          if (verification?.products.length) {
            finalRecommendedProductIds = verification.products
              .slice(0, 3)
              .map((product) => product.id);

            return Response.json({
              reply: formatVerifiedProductsReply(verification),
              recommendedProductIds: finalRecommendedProductIds,
              mode: "ai",
              modelUsed:
                typeof responseData.model === "string"
                  ? responseData.model
                  : SAFE_DIRECT_MODEL,
            } satisfies FloristReply);
          }
        }

        return Response.json({
          reply: finalReply,
          recommendedProductIds: finalRecommendedProductIds,
          mode: "ai",
          modelUsed:
            typeof responseData.model === "string"
              ? responseData.model
              : SAFE_DIRECT_MODEL,
        } satisfies FloristReply);
      }

      const functionOutputs: any[] = [];

      for (const toolCall of toolCallsToExecute) {
        try {
          const toolArgs = { ...toolCall.arguments };

          if (
            toolCall.name === "update_draft" ||
            toolCall.name === "get_draft_summary"
          ) {
            if (!body.draftId) {
              throw new Error(
                `Tool ${toolCall.name} requires draftId in request body`,
              );
            }
            toolArgs.draftId = body.draftId;
          }

          const toolResult = await executeTool(toolCall.name, toolArgs);

          try {
            const toolResultJson = JSON.parse(toolResult);

            if (toolCall.name === "search_products") {
              lastSearchArgs = { ...toolArgs };
              lastSearchResult = toolResultJson;
            }
            if (
              toolResultJson?.data?.products &&
              Array.isArray(toolResultJson.data.products)
            ) {
              recommendedProductIds.push(
                ...toolResultJson.data.products.map((p: any) => p.id),
              );
            }
            if (
              toolResultJson?.data?.id &&
              typeof toolResultJson.data.id === "string"
            ) {
              recommendedProductIds.push(toolResultJson.data.id);
            }
          } catch {
            // Ignore product-id extraction errors.
          }

          functionOutputs.push({
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: toolResult,
          });
        } catch (toolError) {
          console.error("[ai-florist] tool execution error:", toolError);
          functionOutputs.push({
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: JSON.stringify({
              status: "error",
              message: "Tool execution failed",
            }),
          });
        }
      }

      previousResponseId = responseData.id;
      nextInput = functionOutputs;
    }

    clearTimeout(timeout);

    // Max iterations reached
    return Response.json({
      reply: "Пожалуйста, уточните ваш запрос.",
      recommendedProductIds: [],
      mode: "fallback",
      fallbackReason: "network_or_timeout",
    } satisfies FloristReply);
  } catch (error) {
    console.error("[ai-florist] error:", error);
    return Response.json({
      reply: "Техническая ошибка. Попробуйте позже.",
      recommendedProductIds: [],
      mode: "fallback",
      fallbackReason: "network_or_timeout",
    } satisfies FloristReply);
  }
}
