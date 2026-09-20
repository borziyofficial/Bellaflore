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
  const lastUser =
    [...messages].reverse().find((message) => message.role === "user")?.content ??
    "";
  const text = lastUser.toLowerCase();
  const hasBudget =
    /\d/.test(text) || text.includes("бюджет") || text.includes("тыс");
  const hasRecipient =
    /жен|девуш|мам|муж|мужчин|коллег|началь|ребен|доч|сын|себе/.test(text);
  const hasOccasion =
    /день рож|свидан|юбиле|свад|извин|спасибо|просто так|годовщ/.test(text);

  let reply =
    "Я помогу как флорист, а не просто как фильтр каталога. Расскажите немного о человеке и настроении букета — тогда подбор будет точнее.";

  if (!hasRecipient) {
    reply =
      "Для начала скажите, кому выбираем цветы: любимой, маме, коллеге или кому-то ещё? От этого зависит и характер композиции, и оттенки.";
  } else if (!hasOccasion) {
    reply =
      "Понял. А какой повод: день рождения, свидание, годовщина, благодарность или хочется подарить без повода?";
  } else if (!hasBudget) {
    reply =
      "Хорошо. Теперь назовите ориентир по бюджету. Можно просто написать, например: «до 10 тысяч» — я подберу варианты без лишнего.";
  } else if (candidates.length > 0) {
    const names = candidates.slice(0, 2).map((item) => item.title);
    reply =
      `По вашему запросу я бы начал с ${names.join(" и ")}. Если хотите, уточните цветовую гамму — нежную, яркую, белую или пастельную — и я сузю выбор ещё точнее.`;
  }

  return {
    reply,
    recommendedProductIds: hasRecipient && hasOccasion && hasBudget
      ? candidates.slice(0, 3).map((candidate) => candidate.id)
      : [],
    mode: "fallback",
  };
}

export async function POST(request: Request) {
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

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
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
2. Если данных мало, задай только ОДИН самый полезный уточняющий вопрос.
3. Если уже достаточно данных, дай конкретный совет и выбери до 3 реальных товаров.
4. Не дави на покупку.
5. Пиши по-русски, если клиент не перешёл на другой язык.
6. Ответ должен быть ТОЛЬКО валидным JSON без markdown:
{"reply":"текст ответа","recommendedProductIds":["id-1","id-2"]}

CATALOG:
${catalogText || "Нет доступных кандидатов — дай совет и задай уточняющий вопрос, не придумывай товар."}`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model:
          process.env.OPENAI_FLORIST_MODEL?.trim() || "gpt-5.6-luna",
        instructions,
        input: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        max_output_tokens: 600,
      }),
    });

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
