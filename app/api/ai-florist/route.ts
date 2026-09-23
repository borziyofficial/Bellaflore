"use server";

import { getVercelOidcToken } from "@vercel/oidc";

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
};

const AI_RATE_LIMIT_MAX_REQUESTS = 8;
const AI_RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_TOOL_CALLS = 10;
const SAFE_DIRECT_MODEL = "gpt-5.6-sol";
const SAFE_GATEWAY_MODEL = "openai/gpt-5.6-sol";

// Tool definitions for OpenAI function calling
const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
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
  },
  {
    type: "function",
    function: {
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
  },
  {
    type: "function",
    function: {
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
  },
  {
    type: "function",
    function: {
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
  },
  {
    type: "function",
    function: {
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
  },
  {
    type: "function",
    function: {
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
  },
  {
    type: "function",
    function: {
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

async function resolveAiRouting() {
  const openAiApiKey = process.env.OPENAI_API_KEY?.trim() || undefined;
  let gatewayApiKey =
    process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim() || undefined;
  let vercelOidcAvailable = false;

  if (!openAiApiKey && !gatewayApiKey) {
    try {
      const token = (await getVercelOidcToken()).trim();
      if (token) {
        gatewayApiKey = token;
        vercelOidcAvailable = true;
      }
    } catch {
      vercelOidcAvailable = false;
    }
  }

  const useGateway = Boolean(gatewayApiKey);
  return { openAiApiKey, gatewayApiKey, useGateway, vercelOidcAvailable };
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

  const { openAiApiKey, gatewayApiKey, useGateway } = await resolveAiRouting();

  if (!openAiApiKey && !gatewayApiKey) {
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

    // Tool calling loop
    const conversationMessages: FloristMessage[] = [...messages];
    let toolCallCount = 0;

    for (toolCallCount = 0; toolCallCount < MAX_TOOL_CALLS; toolCallCount++) {
      const endpoint = useGateway
        ? "https://ai-gateway.vercel.sh/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";
      const token = useGateway ? gatewayApiKey : openAiApiKey;
      const model = useGateway ? SAFE_GATEWAY_MODEL : SAFE_DIRECT_MODEL;

      // Build messages with system prompt as first message (FIX #4)
      // CRITICAL: Preserve tool_calls and tool_call_id in message history
      const messagesForApi = [
        {
          role: "developer" as const,
          content: systemPrompt,
        },
        ...conversationMessages.map(msg => {
          const msgObj: any = {
            role: msg.role,
            content: typeof msg.content === "string" ? msg.content : msg.content,
          };
          // Preserve tool_calls if present (assistant messages with tool calls)
          if ((msg as any).tool_calls) {
            msgObj.tool_calls = (msg as any).tool_calls;
          }
          // Preserve tool_call_id if present (tool response messages)
          if ((msg as any).tool_call_id) {
            msgObj.tool_call_id = (msg as any).tool_call_id;
          }
          return msgObj;
        }),
      ];

      const requestPayload: Record<string, any> = {
        model,
        messages: messagesForApi,
        tools: TOOL_DEFINITIONS,
        tool_choice: "auto",
        max_tokens: 2000,
      };

      if (useGateway) {
        (requestPayload as any).provider = {
          order: ["openai"],
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });

      if (!response.ok) {
        clearTimeout(timeout);
        console.error("[ai-florist] upstream error", { status: response.status });
        return Response.json({
          reply: "Ошибка при обработке запроса.",
          recommendedProductIds: [],
          mode: "fallback",
          fallbackReason: "upstream_error",
        } satisfies FloristReply);
      }

      const responseData = (await response.json()) as any;
      const choice = responseData.choices?.[0];

      if (!choice) {
        clearTimeout(timeout);
        return Response.json({
          reply: "Не удалось обработать запрос.",
          recommendedProductIds: [],
          mode: "fallback",
          fallbackReason: "invalid_ai_response",
        } satisfies FloristReply);
      }

      // Add assistant message WITH tool_calls to conversation (FIX #3)
      conversationMessages.push({
        role: "assistant",
        content: choice.message.content || "",
        tool_calls: choice.message.tool_calls,
      } as any);

      // Check for tool calls
      const toolCalls = choice.message.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        // No more tool calls - we have the final response
        clearTimeout(timeout);
        
        // Extract recommendedProductIds from conversation history (FIX #2)
        const recommendedProductIds: string[] = [];
        for (const msg of conversationMessages) {
          if (msg.role === "tool") {
            try {
              const toolContent = typeof msg.content === "string" 
                ? JSON.parse(msg.content)
                : msg.content;
              if (toolContent?.data?.productIds && Array.isArray(toolContent.data.productIds)) {
                recommendedProductIds.push(...toolContent.data.productIds);
              }
              if (toolContent?.data?.id && toolContent.data.id.startsWith("prod_")) {
                recommendedProductIds.push(toolContent.data.id);
              }
            } catch {
              // Skip parsing errors
            }
          }
        }
        
        return Response.json({
          reply: choice.message.content || "Я готов помочь подобрать букет.",
          recommendedProductIds: [...new Set(recommendedProductIds)],
          mode: "ai",
        } satisfies FloristReply);
      }

      // Execute tool calls with proper protocol (FIX #2, #3, #5)
      for (const toolCall of toolCalls) {
        try {
          // FIX #2: Parse tool arguments from JSON string
          const toolArgs = typeof toolCall.function.arguments === 'string'
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments;
          
          // FIX #4, #5: Enforce draftId from request body for draft operations
          // Security: prevent model from accessing other drafts
          if ((toolCall.function.name === "update_draft" || toolCall.function.name === "get_draft_summary") && body.draftId) {
            toolArgs.draftId = body.draftId;
          }
          
          const toolResult = await executeTool(toolCall.function.name, toolArgs);
          
          // FIX #3: Add proper tool message (role: "tool", not user)
          conversationMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolResult,
          } as any);
        } catch (toolError) {
          console.error("[ai-florist] tool execution error:", toolError);
          conversationMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({ status: "error", message: "Tool execution failed" }),
          } as any);
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
