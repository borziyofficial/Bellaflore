type FloristMessage = {
  role: "user" | "assistant";
  content: string;
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
};

type FloristReply = {
  reply: string;
  recommendedProductIds: string[];
  mode: "ai" | "fallback";
};

const AI_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const AI_RATE_LIMIT_MAX_REQUESTS = 24;
const MAX_MESSAGE_LENGTH = 1200;

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

function normalizeIds(value: unknown, candidates: FloristCandidate[]): string[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(candidates.map((candidate) => candidate.id));
  return value
    .filter((id): id is string => typeof id === "string" && allowed.has(id))
    .slice(0, 3);
}

function extractOutputText(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const candidate = body as {
    output_text?: unknown;
    output?: Array<{
      content?: Array<{ type?: string; text?: string }>;
    }>;
  };

  if (typeof candidate.output_text === "string") {
    return candidate.output_text;
  }

  for (const item of candidate.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return "";
}

function parseJsonReply(
  text: string,
  candidates: FloristCandidate[],
): Omit<FloristReply, "mode"> | null {
  const normalized = text
    .trim()
    .replace(/^\`\`\`(?:json)?/i, "")
    .replace(/\`\`\`$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(normalized) as {
      reply?: unknown;
      recommendedProductIds?: unknown;
    };
    if (typeof parsed.reply !== "string" || !parsed.reply.trim()) {
      return null;
    }

    return {
      reply: parsed.reply.trim(),
      recommendedProductIds: normalizeIds(
        parsed.recommendedProductIds,
        candidates,
      ),
    };
  } catch {
    return null;
  }
}

function fallbackReply(
  messages: FloristMessage[],
  candidates: FloristCandidate[],
): FloristReply {
  const userMessages = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content);
  const text = userMessages.join(" ").toLowerCase();
  const hasBudget =
    /\d/.test(text) || text.includes("бюджет") || text.includes("тыс");
  const hasRecipient =
    /жен|девуш|мам|муж|мужчин|коллег|началь|ребен|доч|сын|себе/.test(text);
  const hasOccasion =
    /день рож|свидан|юбиле|свад|извин|спасибо|просто так|годовщ|знакомств|первая встреч|первое знакомств/.test(text);
  const firstMeeting =
    /перв(ое|ого|ая)?\s+(знакомств|встреч|свидан)|первое знакомство|первая встреча/.test(text);
  const lastAssistant =
    [...messages].reverse().find((message) => message.role === "assistant")?.content ?? "";
  const latestUser =
    [...messages].reverse().find((message) => message.role === "user")?.content.toLowerCase() ?? "";
  const affirmativeOnly = /^(да|давай|да давай|хорошо|ок|окей|конечно|ага)[.!\s]*$/.test(latestUser);
  const mediumBudgetCandidates = [...candidates]
    .filter((candidate) => candidate.priceRub <= 10000)
    .sort((left, right) => left.priceRub - right.priceRub)
    .slice(0, 3);
  const sensibleCandidates =
    mediumBudgetCandidates.length > 0
      ? mediumBudgetCandidates
      : [...candidates].sort((left, right) => left.priceRub - right.priceRub).slice(0, 3);

  let reply =
    "Я помогу как флорист, а не просто как фильтр каталога. Расскажите немного о человеке и настроении букета — тогда подбор будет точнее.";

  if (firstMeeting) {
    reply =
      "Для первого знакомства я бы выбрал лёгкий, аккуратный букет без слишком торжественного эффекта: нежные или пастельные оттенки, воздушная форма и умеренный размер. Так подарок выглядит внимательным, но не обязывающим. Могу показать подходящие варианты и уже потом сузить их по бюджету.";
  } else if (!hasRecipient) {
    reply =
      "Для начала скажите, кому выбираем цветы: любимой, маме, коллеге или кому-то ещё? От этого зависит и характер композиции, и оттенки.";
  } else if (!hasOccasion) {
    reply =
      "Понял. А какой повод: день рождения, свидание, годовщина, благодарность или хочется подарить без повода?";
  } else if (!hasBudget) {
    if (
      affirmativeOnly &&
      /бюджет|до 10 тысяч|ориентир по бюджету/i.test(lastAssistant)
    ) {
      reply =
        "Давайте без лишних вопросов: возьму за ориентир спокойный средний бюджет и покажу наиболее подходящие варианты. Если захотите — потом просто назовёте предел, и я сразу пересоберу подбор.";
    } else {
      reply =
        "Хорошо. Теперь назовите ориентир по бюджету. Можно просто написать, например: «до 10 тысяч» — я подберу варианты без лишнего.";
    }
  } else if (candidates.length > 0) {
    const names = candidates.slice(0, 2).map((item) => item.title);
    reply =
      `По вашему запросу я бы начал с ${names.join(" и ")}. Если хотите, уточните цветовую гамму — нежную, яркую, белую или пастельную — и я сузю выбор ещё точнее.`;
  }

  if (reply.trim() === lastAssistant.trim()) {
    reply =
      "Не буду повторяться. По тому, что вы уже рассказали, лучше двигаться к лёгкому и аккуратному букету без чрезмерной торжественности. Покажу несколько подходящих вариантов, а бюджет можно уточнить потом.";
  }

  const shouldRecommend =
    firstMeeting ||
    (hasRecipient && hasOccasion && hasBudget) ||
    (affirmativeOnly && /бюджет|до 10 тысяч|ориентир по бюджету/i.test(lastAssistant)) ||
    reply.includes("Не буду повторяться");

  return {
    reply,
    recommendedProductIds: shouldRecommend
      ? sensibleCandidates.map((candidate) => candidate.id)
      : [],
    mode: "fallback",
  };
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
                typeof message.content === "string" &&
                message.content.trim(),
            ),
        )
        .map((message) => ({
          ...message,
          content: message.content.trim().slice(0, MAX_MESSAGE_LENGTH),
        }))
        .slice(-12)
    : [];
  const candidates = Array.isArray(body.candidates)
    ? body.candidates.slice(0, 18)
    : [];

  if (messages.length === 0) {
    return Response.json(
      { message: "Сообщение не найдено." },
      { status: 400 },
    );
  }

  const openAiApiKey = process.env.OPENAI_API_KEY?.trim();
  const gatewayApiKey =
    process.env.AI_GATEWAY_API_KEY?.trim() ||
    process.env.VERCEL_OIDC_TOKEN?.trim();
  const useGateway = Boolean(gatewayApiKey);

  if (!openAiApiKey && !gatewayApiKey) {
    return Response.json(fallbackReply(messages, candidates));
  }

  const catalogText = candidates
    .map((product) => {
      const sizes = (product.sizes ?? [])
        .map((size) => `${size.label}: ${size.price} ₽`)
        .join(", ");
      return [
        `ID: ${product.id}`,
        `Название: ${product.title}`,
        `Цена от: ${product.priceRub} ₽`,
        product.category ? `Категория: ${product.category}` : "",
        product.flowerType ? `Цветы: ${product.flowerType}` : "",
        product.description ? `Описание: ${product.description}` : "",
        product.tags?.length ? `Теги: ${product.tags.join(", ")}` : "",
        sizes ? `Размеры: ${sizes}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
    })
    .join("\n");

  const instructions = `Ты — AI-флорист BellaFlore, премиального цветочного магазина в Москве.
Общайся естественно, уверенно и коротко, как опытный живой флорист-консультант.
Ты можешь:
- уточнять для кого букет, повод, бюджет, любимые оттенки и настроение;
- объяснять сочетания цветов и стили;
- советовать по уходу за цветами;
- мягко объяснять флористические нюансы;
- рекомендовать только товары из списка CATALOG ниже.

Правила:
1. Не выдумывай цены, наличие, сроки доставки или товары.
2. Внимательно используй ВСЮ историю разговора. Никогда не переспрашивай то, что клиент уже сообщил.
3. Если данных мало, задай только ОДИН самый полезный уточняющий вопрос.
4. Если уже достаточно данных, дай конкретный совет и выбери до 3 реальных товаров.
5. Если клиент спрашивает общий вопрос по флористике или уходу, ответь по существу даже без подбора товара.
6. Если речь о доставке, не обещай точное время или цену без checkout; скажи, что BellaFlore уточнит их по адресу.
7. Если клиент просит букет без конкретного цветка, не рекомендуй товары, где этот цветок явно указан в названии/описании.
8. Объясняй рекомендацию человечески: 1–2 коротких причины, почему композиция подходит случаю.
9. Не дави на покупку и не используй агрессивные продажи.
10. Пиши по-русски, если клиент не перешёл на другой язык.
11. Ответ должен быть ТОЛЬКО валидным JSON без markdown:
{"reply":"текст ответа","recommendedProductIds":["id-1","id-2"]}

CATALOG:
${catalogText || "Нет доступных кандидатов — дай совет и задай уточняющий вопрос, не придумывай товар."}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 14_000);
    const configuredModel = process.env.OPENAI_FLORIST_MODEL?.trim();
    const endpoint = useGateway
      ? "https://ai-gateway.vercel.sh/v1/responses"
      : "https://api.openai.com/v1/responses";
    const token = useGateway ? gatewayApiKey : openAiApiKey;
    const model = useGateway
      ? configuredModel || "openai/gpt-5.6-sol"
      : configuredModel?.replace(/^openai\//, "") || "gpt-5.6";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions,
        input: messages.map((message) => ({
          type: "message",
          role: message.role,
          content: message.content,
        })),
        max_output_tokens: 600,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return Response.json(fallbackReply(messages, candidates));
    }

    const responseBody = (await response.json()) as unknown;
    const parsed = parseJsonReply(
      extractOutputText(responseBody),
      candidates,
    );

    if (!parsed) {
      return Response.json(fallbackReply(messages, candidates));
    }

    return Response.json({
      ...parsed,
      mode: "ai",
    } satisfies FloristReply);
  } catch {
    return Response.json(fallbackReply(messages, candidates));
  }
}
