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

type FloristIntent =
  | "greeting"
  | "bella_flore_service_question"
  | "flower_care"
  | "delivery_question"
  | "product_question"
  | "bouquet_selection"
  | "florist_advice";

const AI_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const AI_RATE_LIMIT_MAX_REQUESTS = 24;
const MAX_MESSAGE_LENGTH = 1200;

// ==================================================
// SECTION: SAFE MODEL GUARD
// РАЗДЕЛ: Защита от случайного понижения модели
//
// Purpose (EN):
// The brain is GPT-5.6 Sol. Direct OpenAI uses "gpt-5.6"; Vercel AI
// Gateway uses "openai/gpt-5.6-sol". If OPENAI_FLORIST_MODEL is set to
// anything that does not match the expected GPT-5.6 family, it is
// ignored (logged, never silently trusted) so production can never be
// accidentally downgraded below GPT-5.6 Sol.
// ==================================================
const SAFE_DIRECT_MODEL = "gpt-5.6";
const SAFE_GATEWAY_MODEL = "openai/gpt-5.6-sol";
const ALLOWED_DIRECT_MODEL_PATTERN = /^gpt-5\.6/i;
const ALLOWED_GATEWAY_MODEL_PATTERN = /^openai\/gpt-5\.6/i;

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

/**
 * Applies an extractor to each user message IN ORDER and keeps the LAST
 * non-null result — real conversation memory for values that can be
 * overridden later (budget, color): "до 10 000" followed by "теперь
 * бюджет до 15 000" must resolve to 15 000, not the first value ever
 * mentioned. Exclusions are handled separately — they accumulate instead
 * (see isExcludedCandidate, checked against the full history).
 */
function extractLatest<T>(
  userMessagesInOrder: string[],
  extractor: (message: string) => T | null,
): T | null {
  let result: T | null = null;
  for (const message of userMessagesInOrder) {
    const value = extractor(message.toLowerCase());
    if (value !== null) {
      result = value;
    }
  }
  return result;
}

function eligibleCandidates(
  candidates: FloristCandidate[],
  fullUserText: string,
  budgetLimit: number | null,
  colorPattern: RegExp | null,
): FloristCandidate[] {
  return candidates.filter((candidate) => {
    if (isExcludedCandidate(candidate, fullUserText)) return false;
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

function normalizeIds(value: unknown, eligible: FloristCandidate[]): string[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(eligible.map((candidate) => candidate.id));
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
  eligible: FloristCandidate[],
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
      recommendedProductIds: normalizeIds(parsed.recommendedProductIds, eligible),
    };
  } catch {
    return null;
  }
}

// ==================================================
// SECTION: INTENT CLASSIFICATION
// РАЗДЕЛ: Определение типа вопроса (для честного fallback)
//
// Purpose (EN):
// A deterministic classifier used ONLY by the non-AI fallback path (real
// GPT-5.6 Sol classifies intent itself, guided by the instructions
// prompt). Fixes the reported bug where ANY unrecognized message — e.g.
// "Как вы относитесь к клиентам?" — was forced through the "кому
// выбираем цветы?" recipient questionnaire.
//
// Назначение (RU):
// Детерминированный классификатор для fallback-режима (реальная модель
// сама определяет intent по инструкциям). Не даёт любому нераспознанному
// вопросу превращаться в анкету "кому выбираем цветы?".
// ==================================================
function classifyLatestIntent(
  latestUserText: string,
  conversationHasBouquetContext: boolean,
): FloristIntent {
  const text = latestUserText.trim().toLowerCase();

  const isShortGreeting =
    /^(привет|здравствуйте|здравствуй|добрый день|добрый вечер|доброе утро|хай|hello|hi|здрасьте)\b/.test(
      text,
    ) && text.length <= 40;
  if (isShortGreeting && !conversationHasBouquetContext) {
    return "greeting";
  }

  if (
    /(относ|подход).{0,18}клиент/.test(text) ||
    /клиент.{0,18}(относ|подход)/.test(text) ||
    /как.{0,12}(вы|bellaflore|белла\s?флор).{0,18}работа/.test(text) ||
    /почему.{0,18}(выбрать|вы|bellaflore|белла\s?флор)/.test(text) ||
    /(гарант|качеств).{0,18}(цвет|букет|обслуж|сервис)/.test(text) ||
    /расскажите.{0,12}о\s+(себе|компании|bellaflore|магазине)/.test(text) ||
    /кто\s+вы/.test(text)
  ) {
    return "bella_flore_service_question";
  }

  if (
    /(какие|что).{0,18}(цвет|букет).{0,18}(дольше|долго)\s+сто/.test(text) ||
    /как.{0,18}(дольше|долго)\s+сохран/.test(text) ||
    /(?:^|\s)(уход|поливать|подрезать|менять воду|хранить букет|увядают|завяли)\b/.test(text)
  ) {
    return "flower_care";
  }

  if (
    /(доставк|курьер)/.test(text) &&
    !/(мой заказ|где мой заказ|статус заказа|номер заказа)/.test(text)
  ) {
    return "delivery_question";
  }

  if (
    /(сколько стоит|какая цена|что входит|состав букета|сколько (?:штук|роз|цветов) в)/.test(text)
  ) {
    return "product_question";
  }

  const hasBouquetSignal =
    /жен|девуш|мам|муж|мужчин|коллег|началь|ребен|доч|сын|себе/.test(text) ||
    /день рож|свидан|юбиле|свад|извин|годовщ|знакомств|встреч/.test(text) ||
    /букет|цвет(?:ы|ов)?\s+(?:для|на|в подарок)/.test(text) ||
    /бюджет|тыс|₽|руб/.test(text) ||
    /(?:без|не хочу|не надо|исключи)\s+[^.]{0,18}(?:роз|пион|гортенз|лили|хризантем|георгин|маттиол)/.test(
      text,
    ) ||
    /только\s+(?:бел|розов|красн)/.test(text) ||
    /подбер|подбор|нужен букет|нужны цветы/.test(text);

  if (hasBouquetSignal || conversationHasBouquetContext) {
    return "bouquet_selection";
  }

  return "florist_advice";
}

// ==================================================
// SECTION: REASONING EFFORT
// РАЗДЕЛ: Уровень reasoning для GPT-5.6 Sol
//
// Purpose (EN):
// Simple questions, care tips and general info stay on "medium" effort
// (fast, cheap). A complex multi-constraint bouquet selection (several
// of: recipient, occasion, budget, exclusion, color present at once)
// gets "high" effort. Never defaults to an expensive tier.
// ==================================================
function resolveReasoningEffort(fullUserText: string): "medium" | "high" {
  const signals = [
    /жен|девуш|мам|муж|мужчин|коллег|началь|ребен|доч|сын|себе/.test(fullUserText),
    /день рож|свидан|юбиле|свад|извин|годовщ|знакомств|встреч/.test(fullUserText),
    extractBudgetLimit(fullUserText) !== null,
    /(?:без|не хочу|не надо|исключи)\s+[^.]{0,18}(?:роз|пион|гортенз|лили|хризантем|георгин|маттиол)/.test(
      fullUserText,
    ),
    requestedColorPattern(fullUserText) !== null,
  ].filter(Boolean).length;

  return signals >= 3 ? "high" : "medium";
}

// ==================================================
// SECTION: FALLBACK REPLY
// РАЗДЕЛ: Резервный ответ без AI
//
// Purpose (EN):
// Used only when GPT-5.6 Sol is genuinely unavailable (no credentials,
// upstream error, invalid response, network/timeout). Classifies intent
// first so an unrelated question is never forced through the recipient/
// occasion/budget questionnaire, and remembers earlier constraints using
// latest-message-wins for overridable values (budget, color) and
// full-history accumulation for exclusions.
// ==================================================
function fallbackReply(
  messages: FloristMessage[],
  candidates: FloristCandidate[],
  fallbackReason: FloristFallbackReason,
): FloristReply {
  const orderedUserMessages = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content);
  const fullUserText = orderedUserMessages.join(" ").toLowerCase();
  const latestUser = orderedUserMessages[orderedUserMessages.length - 1] ?? "";
  const latestUserLower = latestUser.toLowerCase();
  const lastAssistant =
    [...messages].reverse().find((message) => message.role === "assistant")?.content ?? "";

  const hasBudget =
    /\d/.test(fullUserText) || fullUserText.includes("бюджет") || fullUserText.includes("тыс");
  const hasRecipient =
    /жен|девуш|мам|муж|мужчин|коллег|началь|ребен|доч|сын|себе/.test(fullUserText);
  const hasOccasion =
    /день рож|свидан|юбиле|свад|извин|спасибо|просто так|годовщ|знакомств|первая встреч|первое знакомств/.test(
      fullUserText,
    );
  const firstMeeting =
    /перв(?:ое|ого|ая)?\s+(?:знакомств|встреч|свидан)|первое знакомство|первая встреча/.test(
      fullUserText,
    );
  const affirmativeOnly = /^(?:да|давай|да давай|хорошо|ок|окей|конечно|ага)[.!\s]*$/.test(
    latestUserLower,
  );
  const asksAboutLongevity =
    /(?:какие|что).{0,18}(?:цветы|букеты).{0,18}(?:дольше|долго)\s+стоят|как.{0,18}(?:дольше|долго)\s+сохран/i.test(
      latestUserLower,
    );
  const addsExclusion =
    /(?:без|не хочу|не надо|исключи)\s+[^.]{0,24}(?:роз|пион|гортенз|лили|хризантем|георгин|маттиол)/i.test(
      latestUserLower,
    );
  const addsBudget = extractBudgetLimit(latestUserLower) !== null;
  const addsColor = requestedColorPattern(latestUserLower) !== null;
  const mentionsWife = /жен(?:е|ы|у)?|супруг/.test(latestUserLower);
  const mentionsMotherBirthday = /мам/.test(latestUserLower) && /день рож/.test(latestUserLower);

  // Latest-message-wins for values that can change turn to turn.
  const budgetLimit = extractLatest(orderedUserMessages, extractBudgetLimit);
  const colorPattern = extractLatest(orderedUserMessages, requestedColorPattern);
  const filteredCandidates = eligibleCandidates(candidates, fullUserText, budgetLimit, colorPattern);
  const mediumBudgetCandidates = [...filteredCandidates]
    .filter((candidate) => (budgetLimit === null ? candidate.priceRub <= 10000 : true))
    .sort((left, right) => left.priceRub - right.priceRub)
    .slice(0, 3);
  const sensibleCandidates =
    mediumBudgetCandidates.length > 0
      ? mediumBudgetCandidates
      : [...filteredCandidates].sort((left, right) => left.priceRub - right.priceRub).slice(0, 3);

  const conversationHasBouquetContext =
    orderedUserMessages.length > 1 && (hasRecipient || hasOccasion || hasBudget);
  const intent = classifyLatestIntent(latestUser, conversationHasBouquetContext);

  const respond = (reply: string, recommendedProductIds: string[] = []): FloristReply => ({
    reply,
    recommendedProductIds,
    mode: "fallback",
    fallbackReason,
  });

  if (intent === "greeting") {
    return respond(
      "Здравствуйте! Я AI-флорист BellaFlore. Могу подобрать букет, посоветовать по уходу за цветами или ответить про сервис и доставку — с чего начнём?",
    );
  }

  if (intent === "bella_flore_service_question") {
    return respond(
      "В BellaFlore к каждому клиенту подходят внимательно и лично: подбираем букет под повод и вкус, собираем его вручную и остаёмся на связи, если что-то нужно уточнить или поменять. Могу помочь подобрать букет прямо сейчас, если хотите.",
    );
  }

  if (intent === "delivery_question") {
    return respond(
      "Точную стоимость и время доставки покажу на оформлении заказа по вашему адресу — они зависят от зоны доставки. Если хотите, для начала подберу букет, а детали доставки уточним на следующем шаге.",
    );
  }

  if (intent === "flower_care") {
    if (asksAboutLongevity) {
      return respond(
        "Дольше всего обычно радуют хризантемы, гвоздики, альстромерии и маттиола; при свежем срезе и правильном уходе они часто стоят заметно дольше нежных сезонных цветов. Подрезайте стебли, меняйте воду каждые 1–2 дня и держите букет вдали от батарей, солнца и фруктов.",
      );
    }
    return respond(
      "Чтобы букет стоял дольше: подрезайте стебли под углом сразу после покупки, меняйте воду каждые 1–2 дня и держите цветы вдали от батарей, прямого солнца и фруктов. Если подскажете, какие именно цветы вас интересуют, дам более точный совет.",
    );
  }

  if (intent === "product_question" && filteredCandidates.length === 0) {
    return respond(
      "Уточните, пожалуйста, какой букет вас интересует — назовите название или опишите, что ищете, и я расскажу подробнее.",
    );
  }

  if (intent === "florist_advice") {
    return respond(
      "Я помогу как флорист, а не просто как фильтр каталога. Расскажите немного о человеке и настроении букета — тогда подбор будет точнее, а если у вас общий вопрос про цветы или уход, тоже спрашивайте.",
    );
  }

  // intent === "bouquet_selection" (or "product_question" with real
  // candidates available) — the constraint-aware selection funnel.
  let reply =
    "Я помогу как флорист, а не просто как фильтр каталога. Расскажите немного о человеке и настроении букета — тогда подбор будет точнее.";
  let recommendedProductIds: string[] = [];

  if (addsColor && filteredCandidates.length > 0) {
    reply = `Оставил только нужную цветовую гамму и сохранил остальные условия. Подойдёт ${formatCandidateNames(sensibleCandidates)}.`;
    recommendedProductIds = sensibleCandidates.map((candidate) => candidate.id);
  } else if (addsBudget && filteredCandidates.length > 0) {
    reply = `Учёл бюджет до ${new Intl.NumberFormat("ru-RU").format(budgetLimit ?? 10000)} ₽ и все предыдущие пожелания. Показываю ${formatCandidateNames(sensibleCandidates)}.`;
    recommendedProductIds = sensibleCandidates.map((candidate) => candidate.id);
  } else if (addsExclusion) {
    const names = formatCandidateNames(sensibleCandidates);
    reply =
      sensibleCandidates.length > 0
        ? `Исключение запомнил — таких цветов в подборке не будет. Показываю ${names}.`
        : "Исключение запомнил. Среди доступных кандидатов сейчас нет точного совпадения, поэтому не буду придумывать товар.";
    recommendedProductIds = sensibleCandidates.map((candidate) => candidate.id);
  } else if (affirmativeOnly && firstMeeting) {
    reply = `Показываю лёгкие варианты для первого знакомства: ${formatCandidateNames(sensibleCandidates)}. Если захотите сузить выбор, просто назовите бюджет или цвет.`;
    recommendedProductIds = sensibleCandidates.map((candidate) => candidate.id);
  } else if (mentionsMotherBirthday && sensibleCandidates.length > 0) {
    reply = `Для мамы на день рождения я бы выбрал тёплую, выразительную композицию без лишней строгости. С учётом ваших условий подойдёт ${formatCandidateNames(sensibleCandidates)}.`;
    recommendedProductIds = sensibleCandidates.map((candidate) => candidate.id);
  } else if (mentionsWife && sensibleCandidates.length > 0) {
    reply = `Для жены я бы выбрал личный и романтичный букет с аккуратной премиальной подачей. С учётом ваших условий подойдёт ${formatCandidateNames(sensibleCandidates)}.`;
    recommendedProductIds = sensibleCandidates.map((candidate) => candidate.id);
  } else if (firstMeeting) {
    reply =
      "Для первого знакомства я бы выбрал лёгкий, аккуратный букет без слишком торжественного эффекта: нежные или пастельные оттенки, воздушная форма и умеренный размер. Так подарок выглядит внимательным, но не обязывающим. Могу показать подходящие варианты и уже потом сузить их по бюджету.";
    recommendedProductIds = sensibleCandidates.map((candidate) => candidate.id);
  } else if (!hasRecipient) {
    reply =
      "Для начала скажите, кому выбираем цветы: любимой, маме, коллеге или кому-то ещё? От этого зависит и характер композиции, и оттенки.";
  } else if (!hasOccasion) {
    reply = "Понял. А какой повод: день рождения, свидание, годовщина, благодарность или хочется подарить без повода?";
  } else if (!hasBudget) {
    if (affirmativeOnly && /бюджет|до 10 тысяч|ориентир по бюджету/i.test(lastAssistant)) {
      reply =
        "Давайте без лишних вопросов: возьму за ориентир спокойный средний бюджет и покажу наиболее подходящие варианты. Если захотите — потом просто назовёте предел, и я сразу пересоберу подбор.";
    } else {
      reply = "Хорошо. Теперь назовите ориентир по бюджету. Можно просто написать, например: «до 10 тысяч» — я подберу варианты без лишнего.";
    }
  } else if (filteredCandidates.length > 0) {
    const names = formatCandidateNames(filteredCandidates.slice(0, 2));
    reply = `По вашему запросу я бы начал с ${names}. Если хотите, уточните цветовую гамму — нежную, яркую, белую или пастельную — и я сузю выбор ещё точнее.`;
    recommendedProductIds = filteredCandidates.slice(0, 3).map((candidate) => candidate.id);
  }

  if (reply.trim() === lastAssistant.trim()) {
    reply =
      "Не буду повторяться. По тому, что вы уже рассказали, лучше двигаться к лёгкому и аккуратному букету без чрезмерной торжественности. Покажу несколько подходящих вариантов, а бюджет можно уточнить потом.";
    recommendedProductIds = sensibleCandidates.map((candidate) => candidate.id);
  }

  return respond(reply, recommendedProductIds);
}

// ==================================================
// SECTION: AI ROUTING + SAFE MODEL RESOLUTION
// РАЗДЕЛ: Выбор провайдера и безопасной модели
// ==================================================
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

type SafeModelResolution = {
  model: string;
  usedConfiguredModel: boolean;
  ignoredUnsafeConfiguredModel: string | null;
};

function resolveSafeModel(useGateway: boolean, configuredModel: string | undefined): SafeModelResolution {
  const defaultModel = useGateway ? SAFE_GATEWAY_MODEL : SAFE_DIRECT_MODEL;

  if (!configuredModel) {
    return { model: defaultModel, usedConfiguredModel: false, ignoredUnsafeConfiguredModel: null };
  }

  const candidateModel = useGateway ? configuredModel : configuredModel.replace(/^openai\//, "");
  const allowedPattern = useGateway ? ALLOWED_GATEWAY_MODEL_PATTERN : ALLOWED_DIRECT_MODEL_PATTERN;

  if (allowedPattern.test(candidateModel)) {
    return { model: candidateModel, usedConfiguredModel: true, ignoredUnsafeConfiguredModel: null };
  }

  return {
    model: defaultModel,
    usedConfiguredModel: false,
    ignoredUnsafeConfiguredModel: configuredModel,
  };
}

// ==================================================
// SECTION: DIAGNOSTICS (GET)
// РАЗДЕЛ: Безопасная диагностика без секретов
//
// Purpose (EN):
// Reports credential presence as booleans only (never values), the
// resolved provider/endpoint/model, and whether a request right now
// would return mode "ai" or "fallback" — so a missing-credentials
// fallback in production can be diagnosed precisely without ever
// exposing a secret.
// ==================================================
export async function GET() {
  const openAiApiKeyConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());
  const aiGatewayApiKeyConfigured = Boolean(process.env.AI_GATEWAY_API_KEY?.trim());
  const vercelOidcTokenEnvConfigured = Boolean(process.env.VERCEL_OIDC_TOKEN?.trim());
  const { useGateway, vercelOidcAvailable } = await resolveAiRouting();

  const hasAnyCredentials =
    openAiApiKeyConfigured || aiGatewayApiKeyConfigured || vercelOidcTokenEnvConfigured || vercelOidcAvailable;
  const configuredModel = process.env.OPENAI_FLORIST_MODEL?.trim();
  const resolution = resolveSafeModel(useGateway, configuredModel);

  return Response.json({
    ok: true,
    diagnostics: {
      openAiApiKeyConfigured,
      aiGatewayApiKeyConfigured,
      vercelOidcTokenEnvConfigured,
      vercelOidcAvailable,
      provider: !hasAnyCredentials ? "none" : useGateway ? "vercel-ai-gateway" : "openai-direct",
      endpoint: !hasAnyCredentials
        ? null
        : useGateway
          ? "https://ai-gateway.vercel.sh/v1/responses"
          : "https://api.openai.com/v1/responses",
      expectedModel: resolution.model,
      configuredModelEnv: configuredModel ?? null,
      configuredModelIgnoredAsUnsafe: resolution.ignoredUnsafeConfiguredModel,
      willReturnMode: hasAnyCredentials ? "ai" : "fallback",
      fallbackReasonIfNoCredentials: hasAnyCredentials ? null : "missing_credentials",
    },
  });
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
  const candidates = Array.isArray(body.candidates) ? body.candidates.slice(0, 18) : [];

  if (messages.length === 0) {
    return Response.json(
      { message: "Сообщение не найдено." },
      { status: 400 },
    );
  }

  const { openAiApiKey, gatewayApiKey, useGateway } = await resolveAiRouting();

  if (!openAiApiKey && !gatewayApiKey) {
    console.info("[ai-florist] mode=fallback reason=missing_credentials");
    return Response.json(fallbackReply(messages, candidates, "missing_credentials"));
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

Сначала определи ТИП вопроса (про себя, не выводи это клиенту):
- greeting/general_conversation — приветствие или общий разговор;
- bella_flore_service_question — вопрос о том, как BellaFlore относится к клиентам, о сервисе, подходе, компании;
- flower_care — уход за цветами, срок жизни букета;
- delivery_question — вопрос про доставку;
- product_question — вопрос про конкретный товар;
- florist_advice — общий флористический вопрос без подбора;
- bouquet_selection — клиент хочет подобрать букет.

Если вопрос НЕ про подбор букета — ответь по существу, коротко и по-человечески, и НЕ спрашивай "кому выбираем цветы", даже если это первое сообщение в диалоге.

Ты можешь:
- уточнять для кого букет, повод, бюджет, любимые оттенки и настроение — но ТОЛЬКО когда клиент действительно выбирает букет;
- объяснять сочетания цветов и стили;
- советовать по уходу за цветами;
- мягко объяснять флористические нюансы;
- рекомендовать только товары из списка CATALOG ниже.

Правила:
1. Не выдумывай цены, наличие, сроки доставки или товары.
2. Внимательно используй ВСЮ историю разговора. Никогда не переспрашивай то, что клиент уже сообщил. Если клиент меняет одно условие (например, бюджет), сохрани все остальные условия без изменений.
3. Если данных мало для подбора букета, задай только ОДИН самый полезный уточняющий вопрос.
4. Если уже достаточно данных, дай конкретный совет и выбери до 3 реальных товаров.
5. Если клиент спрашивает общий вопрос по флористике, уходу или про BellaFlore, ответь по существу даже без подбора товара.
6. Если речь о доставке, не обещай точное время или цену без checkout; скажи, что BellaFlore уточнит их по адресу.
7. Если клиент просит букет без конкретного цветка, не рекомендуй товары, где этот цветок явно указан в названии/описании.
8. Объясняй рекомендацию человечески: 1–2 коротких причины, почему композиция подходит случаю.
9. Не дави на покупку и не используй агрессивные продажи.
10. Пиши по-русски, если клиент не перешёл на другой язык.
11. recommendedProductIds — только реальные ID из CATALOG, не более 3, пустой массив если рекомендация не нужна.

CATALOG:
${catalogText || "Нет доступных кандидатов — дай совет и задай уточняющий вопрос, не придумывай товар."}`;

  const configuredModel = process.env.OPENAI_FLORIST_MODEL?.trim();
  const modelResolution = resolveSafeModel(useGateway, configuredModel);
  if (modelResolution.ignoredUnsafeConfiguredModel) {
    console.warn("[ai-florist] Ignoring unsafe OPENAI_FLORIST_MODEL — would downgrade below GPT-5.6 Sol", {
      configuredModelEnv: modelResolution.ignoredUnsafeConfiguredModel,
      usingInstead: modelResolution.model,
    });
  }
  const model = modelResolution.model;
  const endpoint = useGateway
    ? "https://ai-gateway.vercel.sh/v1/responses"
    : "https://api.openai.com/v1/responses";
  const token = useGateway ? gatewayApiKey : openAiApiKey;
  const provider = useGateway ? "vercel-ai-gateway" : "openai-direct";

  const orderedUserMessages = messages.filter((message) => message.role === "user").map((message) => message.content);
  const fullUserText = orderedUserMessages.join(" ").toLowerCase();
  const reasoningEffort = resolveReasoningEffort(fullUserText);
  const budgetLimit = extractLatest(orderedUserMessages, extractBudgetLimit);
  const colorPattern = extractLatest(orderedUserMessages, requestedColorPattern);
  const eligible = eligibleCandidates(candidates, fullUserText, budgetLimit, colorPattern);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 14_000);

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
        max_output_tokens: 700,
        reasoning: { effort: reasoningEffort },
        text: {
          format: {
            type: "json_schema",
            name: "florist_reply",
            strict: true,
            schema: {
              type: "object",
              properties: {
                reply: { type: "string" },
                recommendedProductIds: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["reply", "recommendedProductIds"],
              additionalProperties: false,
            },
          },
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error("[ai-florist] mode=fallback reason=upstream_error", {
        provider,
        model,
        upstreamStatus: response.status,
      });
      return Response.json(fallbackReply(messages, candidates, "upstream_error"));
    }

    const responseBody = (await response.json()) as unknown;
    const parsed = parseJsonReply(extractOutputText(responseBody), eligible);

    if (!parsed) {
      console.error("[ai-florist] mode=fallback reason=invalid_ai_response", { provider, model });
      return Response.json(fallbackReply(messages, candidates, "invalid_ai_response"));
    }

    console.info("[ai-florist] mode=ai", { provider, model, reasoningEffort });
    return Response.json({
      ...parsed,
      mode: "ai",
    } satisfies FloristReply);
  } catch (error) {
    console.error("[ai-florist] mode=fallback reason=network_or_timeout", {
      provider,
      model,
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return Response.json(fallbackReply(messages, candidates, "network_or_timeout"));
  }
}
