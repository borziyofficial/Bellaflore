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
        return Response.json({
          reply: textParts.join("\n").trim() || "Я готов помочь подобрать букет.",
          recommendedProductIds: [...new Set(recommendedProductIds)].slice(0, 3),
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
