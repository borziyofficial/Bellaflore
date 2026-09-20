import { getVercelOidcToken } from "@vercel/oidc";

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

type FloristFallbackReason =
  | "missing_credentials"
  | "upstream_error"
  | "invalid_ai_response"
  | "network_or_timeout";

type FloristReply = {
  reply: string;
  recommendedProductIds: string[];
  mode: "ai" | "fallback";
  fallbackReason?: FloristFallbackReason;
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

function candidateSearchText(candidate: FloristCandidate): string {
  return [
    candidate.title,
    candidate.category,
    candidate.flowerType,
    candidate.description,
    ...(candidate.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isExcludedCandidate(
  candidate: FloristCandidate,
  userText: string,
): boolean {
  const haystack = candidateSearchText(candidate);
  const exclusions: Array<{ request: RegExp; product: RegExp }> = [
    { request: /(?:без|не хочу|не надо|исключи)\s+[^.]{0,18}роз/i, product: /роз/i },
    { request: /(?:без|не хочу|не надо|исключи)\s+[^.]{0,18}пион/i, product: /пион/i },
    { request: /(?:без|не хочу|не надо|исключи)\s+[^.]{0,18}гортенз/i, product: /гортенз/i },
    { request: /(?:без|не хочу|не надо|исключи)\s+[^.]{0,18}лили/i, product: /лили/i },
    { request: /(?:без|не хочу|не надо|исключи)\s+[^.]{0,18}хризантем/i, product: /хризантем/i },
    { request: /(?:без|не хочу|не надо|исключи)\s+[^.]{0,18}георгин/i, product: /георгин/i },
    { request: /(?:без|не хочу|не надо|исключи)\s+[^.]{0,18}маттиол/i, product: /маттиол/i },
  ];

  return exclusions.some(
    ({ request, product }) => request.test(userText) && product.test(haystack),
  );
}

function extractBudgetLimit(text: string): number | null {
  const normalized = text.toLowerCase().replace(/\s+/g, " ");
  const thousandMatch = normalized.match(
    /(?:до|бюджет|примерно|около)?\s*(\d{1,3}(?:[.,]\d+)?)\s*(?:тыс|тысяч)/,
  );
  if (thousandMatch) {
    return Math.round(Number(thousandMatch[1].replace(",", ".")) * 1000);
  }

  const rubleMatch = normalized.match(
    /(?:до|бюджет|примерно|около)\s*(\d{4,6})\s*(?:₽|руб)?/,
  );
  return rubleMatch ? Number(rubleMatch[1]) : null;
}

function requestedColorPattern(userText: string): RegExp | null {
  const colorRequests: Array<{ request: RegExp; product: RegExp }> = [
    {
      request: /(?:только|лишь|исключительно)\s+бел|(?:в|только)\s+бел(?:ой|ые|ый)/i,
      product: /бел|white/i,
    },
    {
      request: /(?:только|лишь|исключительно)\s+розов|(?:в|только)\s+розов(?:ой|ые|ый)/i,
      product: /розов|pink/i,
    },
    {
      request: /(?:только|лишь|исключительно)\s+красн|(?:в|только)\s+красн(?:ой|ые|ый)/i,
      product: /красн|ал(?:ый|ая|ые)|red/i,
    },
  ];

  return colorRequests.find(({ request }) => request.test(userText))?.product ?? null;
}

function eligibleCandidates(
  candidates: FloristCandidate[],
  userText: string,
): FloristCandidate[] {
  const budgetLimit = extractBudgetLimit(userText);
  const colorPattern = requestedColorPattern(userText);

  return candidates.filter((candidate) => {
    if (isExcludedCandidate(candidate, userText)) return false;
    if (budgetLimit !== null && candidate.priceRub > budgetLimit) return false;
    if (colorPattern && !colorPattern.test(candidateSearchText(candidate))) {
      return false;
    }
    return true;
  });
}

function formatCandidateNames(candidates: FloristCandidate[]): string {
  return candidates.map((candidate) => `«${candidate.title}»`).join(" и ");
}

function normalizeIds(
  value: unknown,
  candidates: FloristCandidate[],
  userText: string,
): string[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(
    eligibleCandidates(candidates, userText).map((candidate) => candidate.id),
  );
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
  userText: string,
): Omit<FloristReply, "mode" | "fallbackReason"> | null {
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
        userText,
      ),
    };
  } catch {
    return null;
  }
}

function fallbackReply(
  messages: FloristMessage[],
  candidates: FloristCandidate[],
  fallbackReason: FloristFallbackReason,
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
  const asksAboutLongevity = /(?:какие|что).{0,18}(?:цветы|букеты).{0,18}(?:дольше|долго)\s+стоят|как.{0,18}(?:дольше|долго)\s+сохран/i.test(latestUser);
  const addsExclusion = /(?:без|не хочу|не надо|исключи)\s+[^.]{0,24}(?:роз|пион|гортенз|лили|хризантем|георгин|маттиол)/i.test(latestUser);
  const addsBudget = extractBudgetLimit(latestUser) !== null;
  const addsColor = requestedColorPattern(latestUser) !== null;
  const mentionsWife = /жен(?:е|ы|у)?|супруг/.test(latestUser);
  const mentionsMotherBirthday = /мам/.test(latestUser) && /день рож/.test(latestUser);
  const filteredCandidates = eligibleCandidates(candidates, text);
  const explicitBudget = extractBudgetLimit(text);
  const mediumBudgetCandidates = [...filteredCandidates]
    .filter((candidate) =>
      explicitBudget === null ? candidate.priceRub <= 10000 : true,
    )
    .sort((left, right) => left.priceRub - right.priceRub)
    .slice(0, 3);
  const sensibleCandidates =
    mediumBudgetCandidates.length > 0
      ? mediumBudgetCandidates
      : [...filteredCandidates]
          .sort((left, right) => left.priceRub - right.priceRub)
          .slice(0, 3);

  let reply =
    "Я помогу как флорист, а не просто как фильтр каталога. Расскажите немного о человеке и настроении букета — тогда подбор будет точнее.";

  if (asksAboutLongevity) {
    reply =
      "Дольше всего обычно радуют хризантемы, гвоздики, альстромерии и маттиола; при свежем срезе и правильном уходе они часто стоят заметно дольше нежных сезонных цветов. Подрезайте стебли, меняйте воду каждые 1–2 дня и держите букет вдали от батарей, солнца и фруктов.";
  } else if (addsColor && filteredCandidates.length > 0) {
    reply = `Оставил только белую гамму и сохранил остальные условия. Подойдёт ${formatCandidateNames(sensibleCandidates)}.`;
  } else if (addsBudget && filteredCandidates.length > 0) {
    reply = `Учёл бюджет до ${new Intl.NumberFormat("ru-RU").format(explicitBudget ?? 10000)} ₽ и все предыдущие пожелания. Показываю ${formatCandidateNames(sensibleCandidates)}.`;
  } else if (addsExclusion) {
    const names = formatCandidateNames(sensibleCandidates);
    reply =
      sensibleCandidates.length > 0
        ? `Исключение запомнил — таких цветов в подборке не будет. Показываю ${names}.`
        : "Исключение запомнил. Среди доступных кандидатов сейчас нет точного совпадения, поэтому не буду придумывать товар.";
  } else if (affirmativeOnly && firstMeeting) {
    reply = `Показываю лёгкие варианты для первого знакомства: ${formatCandidateNames(sensibleCandidates)}. Если захотите сузить выбор, просто назовите бюджет или цвет.`;
  } else if (mentionsMotherBirthday && sensibleCandidates.length > 0) {
    reply = `Для мамы на день рождения я бы выбрал тёплую, выразительную композицию без лишней строгости. С учётом ваших условий подойдёт ${formatCandidateNames(sensibleCandidates)}.`;
  } else if (mentionsWife && sensibleCandidates.length > 0) {
    reply = `Для жены я бы выбрал личный и романтичный букет с аккуратной премиальной подачей. С учётом ваших условий подойдёт ${formatCandidateNames(sensibleCandidates)}.`;
  } else if (/перв(ое|ого|ая)?\s+(знакомств|встреч|свидан)|первое знакомство|первая встреча/.test(latestUser)) {
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
  } else if (filteredCandidates.length > 0) {
    const names = formatCandidateNames(filteredCandidates.slice(0, 2));
    reply =
      `По вашему запросу я бы начал с ${names}. Если хотите, уточните цветовую гамму — нежную, яркую, белую или пастельную — и я сузю выбор ещё точнее.`;
  }

  if (reply.trim() === lastAssistant.trim()) {
    reply =
      "Не буду повторяться. По тому, что вы уже рассказали, лучше двигаться к лёгкому и аккуратному букету без чрезмерной торжественности. Покажу несколько подходящих вариантов, а бюджет можно уточнить потом.";
  }

  const shouldRecommend =
    !asksAboutLongevity &&
    (firstMeeting ||
    addsExclusion ||
    addsBudget ||
    addsColor ||
    mentionsWife ||
    mentionsMotherBirthday ||
    (hasRecipient && hasOccasion && hasBudget) ||
    (affirmativeOnly && /бюджет|до 10 тысяч|ориентир по бюджету/i.test(lastAssistant)) ||
    reply.includes("Не буду повторяться"));

  return {
    reply,
    recommendedProductIds: shouldRecommend
      ? sensibleCandidates.map((candidate) => candidate.id)
      : [],
    mode: "fallback",
    fallbackReason,
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
  let gatewayApiKey =
    process.env.AI_GATEWAY_API_KEY?.trim() ||
    process.env.VERCEL_OIDC_TOKEN?.trim();

  if (!openAiApiKey && !gatewayApiKey) {
    try {
      gatewayApiKey = (await getVercelOidcToken()).trim();
    } catch {
      // The deterministic fallback below remains available when the project
      // has not enabled Vercel OIDC / AI Gateway authentication.
    }
  }
  const useGateway = Boolean(gatewayApiKey);

  if (!openAiApiKey && !gatewayApiKey) {
    return Response.json(
      fallbackReply(messages, candidates, "missing_credentials"),
    );
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
      return Response.json(
        fallbackReply(messages, candidates, "upstream_error"),
      );
    }

    const responseBody = (await response.json()) as unknown;
    const userText = messages
      .filter((message) => message.role === "user")
      .map((message) => message.content)
      .join(" ")
      .toLowerCase();
    const parsed = parseJsonReply(
      extractOutputText(responseBody),
      candidates,
      userText,
    );

    if (!parsed) {
      return Response.json(
        fallbackReply(messages, candidates, "invalid_ai_response"),
      );
    }

    return Response.json({
      ...parsed,
      mode: "ai",
    } satisfies FloristReply);
  } catch {
    return Response.json(
      fallbackReply(messages, candidates, "network_or_timeout"),
    );
  }
}
