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
    name: "search_products",
    description: "Search for products in the catalog",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        maxPrice: { type: "number", description: "Max price" },
        limit: { type: "number", description: "Number of results" },
      },
      required: ["query"],
    },
  },
  {
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

  const systemPrompt = `Ты — AI-флорист BellaFlore, премиального цветочного магазина в Москве.
Общайся естественно и коротко, как опытный живой консультант.

Используй инструменты для:
- Поиска букетов (search_products)
- Получения деталей (get_product)
- Проверки адреса (validate_address)
- Расчета доставки (calculate_delivery)
- Сохранения данных в черновик (update_draft)

ВАЖНЫЕ ПРАВИЛА:
1. Собирай постепенно: имя, телефон, адрес, дату, выбор букетов
2. Используй update_draft чтобы сохранять собранные данные
3. Никогда не выдумывай цены или товары
4. Рекомендуй только товары из search_products результатов
5. Если адрес не валиден, не подставляй координаты 0,0 — попроси уточнить адрес
6. НЕ вызывай finalize_order_from_draft — это вызывает пользователь кнопкой Confirm`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 28_000);

    // Build input array for Responses API
    // Input is an array of items with type: "text" | "function_call_output"
    const inputItems: any[] = [];

    // Add system instructions as first item
    inputItems.push({
      type: "text",
      text: systemPrompt,
    });

    // Add conversation messages
    for (const msg of messages) {
      if (msg.role === "user") {
        inputItems.push({
          type: "text",
          text: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
        });
      } else if (msg.role === "assistant") {
        // In Responses API, we don't resend assistant messages in the same way
        // They will be part of the previous response flow or handled differently
        // For now, skip them as Responses API handles message history differently
      } else if (msg.role === "tool" && (msg as any).tool_call_id) {
        // Function call output from previous iteration
        inputItems.push({
          type: "function_call_output",
          call_id: (msg as any).tool_call_id,
          output: msg.content,
        });
      }
    }

    // Tool calling loop for Responses API
    let toolCallCount = 0;
    let finalReply = "";
    const recommendedProductIds: string[] = [];

    for (toolCallCount = 0; toolCallCount < MAX_TOOL_CALLS; toolCallCount++) {
      // Call Responses API endpoint
      const requestPayload = {
        model: SAFE_DIRECT_MODEL,
        input: inputItems,
        tools: TOOL_DEFINITIONS,
      };

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
          errorDetails = `${errorJson.error?.type || "unknown"}: ${errorJson.error?.message || ""}`;
        } catch {
          errorDetails = errorText.slice(0, 200);
        }
        console.error("[ai-florist] Responses API error", {
          status: response.status,
          error: errorDetails.slice(0, 500)
        });
        return Response.json({
          reply: "Ошибка при обработке запроса.",
          recommendedProductIds: [],
          mode: "fallback",
          fallbackReason: "upstream_error",
        } satisfies FloristReply);
      }

      const responseData = (await response.json()) as any;
      const output = responseData.output;

      if (!Array.isArray(output) || output.length === 0) {
        clearTimeout(timeout);
        console.error("[ai-florist] Invalid response format");
        return Response.json({
          reply: "Не удалось обработать запрос.",
          recommendedProductIds: [],
          mode: "fallback",
          fallbackReason: "invalid_ai_response",
        } satisfies FloristReply);
      }

      // Process output items
      let hasToolCalls = false;
      const toolCallsToExecute: Array<{ call_id: string; name: string; arguments: any }> = [];

      for (const item of output) {
        if (item.type === "text") {
          finalReply = item.text || "";
        } else if (item.type === "function_call") {
          hasToolCalls = true;
          toolCallsToExecute.push({
            call_id: item.call_id,
            name: item.name,
            arguments: typeof item.arguments === "string"
              ? JSON.parse(item.arguments)
              : item.arguments,
          });
        }
      }

      // If no tool calls, we have the final response
      if (!hasToolCalls) {
        clearTimeout(timeout);

        // Extract product IDs from output if any
        for (const item of output) {
          if (item.type === "text") {
            // Try to extract product IDs from tool results that were returned
            try {
              // This is a simplified extraction; real implementation might be more sophisticated
              const productIdPattern = /product[_-]?\d+|id:?\s*["\']?([a-zA-Z0-9\-]+)["\']?/gi;
              // Note: This is basic; rely on explicit tool results instead
            } catch {
              // Skip extraction errors
            }
          }
        }

        return Response.json({
          reply: finalReply || "Я готов помочь подобрать букет.",
          recommendedProductIds: [...new Set(recommendedProductIds)].slice(0, 3),
          mode: "ai",
          modelUsed: SAFE_DIRECT_MODEL,
        } satisfies FloristReply);
      }

      // Execute tool calls
      for (const toolCall of toolCallsToExecute) {
        try {
          const toolArgs = toolCall.arguments;

          // Enforce draftId from request body for draft operations
          if (toolCall.name === "update_draft" || toolCall.name === "get_draft_summary") {
            if (!body.draftId) {
              throw new Error(`Tool ${toolCall.name} requires draftId in request body`);
            }
            toolArgs.draftId = body.draftId;
          }

          const toolResult = await executeTool(toolCall.name, toolArgs);

          // Parse and extract product IDs if this is a search or product result
          try {
            const toolResultJson = JSON.parse(toolResult);
            if (toolResultJson?.data?.products && Array.isArray(toolResultJson.data.products)) {
              recommendedProductIds.push(...toolResultJson.data.products.map((p: any) => p.id));
            }
            if (toolResultJson?.data?.id && typeof toolResultJson.data.id === "string") {
              recommendedProductIds.push(toolResultJson.data.id);
            }
          } catch {
            // Ignore parsing errors
          }

          // Add function_call_output item to input for next iteration
          inputItems.push({
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: toolResult,
          });
        } catch (toolError) {
          console.error("[ai-florist] tool execution error:", toolError);
          inputItems.push({
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: JSON.stringify({ status: "error", message: "Tool execution failed" }),
          });
        }
      }
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
