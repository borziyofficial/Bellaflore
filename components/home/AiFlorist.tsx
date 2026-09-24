"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { ProductImageWithFallback } from "@/components/product/ProductImageWithFallback";
import type { CatalogProduct } from "@/data/catalogProducts";
import styles from "@/components/home/AiFlorist.module.css";


// Функция парсинга markdown: **text** → <strong>text</strong>
// Безопасно парсит без dangerouslySetInnerHTML
function renderMarkdownMessage(text: string): React.ReactNode {
  if (!text) return text;

  // Простой парсинг **text** через split
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return <strong key={idx}>{boldText}</strong>;
    }
    return part;
  });
}

type AiFloristProps = {
  bouquets: CatalogProduct[];
  formatPrice: (priceRub: number) => string;
  onProductOpen?: (productId: string) => void;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendedProductIds?: string[];
};

type ApiReply = {
  reply?: string;
  recommendedProductIds?: string[];
  mode?: "ai" | "fallback";
  fallbackReason?:
    | "missing_credentials"
    | "upstream_error"
    | "invalid_ai_response"
    | "network_or_timeout";
  message?: string;
};

const QUICK_PROMPTS = [
  "Букет для жены",
  "Маме на день рождения",
  "Нужен совет до 10 000 ₽",
  "Какие цветы дольше стоят?",
];

const CHAT_STORAGE_KEY = "bellaflore:ai-florist-chat-v3";
const DRAFT_STORAGE_KEY = "bellaflore:ai-florist-draft-id-v1";
const CHAT_STORAGE_LIMIT = 20;

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Здравствуйте. Я AI-флорист BellaFlore. Расскажите, для кого выбираете цветы или какой нужен совет — я помогу как флорист, а не просто покажу фильтр каталога.",
};

function searchableText(product: CatalogProduct): string {
  return [
    product.title,
    product.description,
    product.category,
    product.flowerType,
    ...(product.tags ?? []),
    ...(product.searchTerms ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isExcludedByConversation(product: CatalogProduct, userText: string): boolean {
  const haystack = searchableText(product);
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
    ({ request, product: productPattern }) =>
      request.test(userText) && productPattern.test(haystack),
  );
}

function extractBudget(text: string): number | null {
  const normalized = text.toLowerCase().replace(/\s+/g, " ");
  const thousandMatch = normalized.match(/(\d{1,3}(?:[.,]\d+)?)\s*(?:тыс|тысяч)/);
  if (thousandMatch) {
    return Math.round(Number(thousandMatch[1].replace(",", ".")) * 1000);
  }

  const rubleMatch = normalized.match(/(?:до|бюджет|примерно|около)?\s*(\d{4,6})\s*(?:₽|руб)?/);
  return rubleMatch ? Number(rubleMatch[1]) : null;
}

function selectCandidates(
  bouquets: CatalogProduct[],
  messages: ChatMessage[],
): CatalogProduct[] {
  const userText = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join(" ")
    .toLowerCase();
  const budget = extractBudget(userText);

  const tokens = Array.from(
    new Set(
      userText
        .replace(/[^a-zа-яё0-9\s-]/gi, " ")
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 4 && !/^\d+$/.test(token)),
    ),
  ).slice(-18);

  return bouquets
    .filter((product) => !isExcludedByConversation(product, userText))
    .map((product, index) => {
      const haystack = searchableText(product);
      let score = 0;

      for (const token of tokens) {
        if (haystack.includes(token)) score += 5;
      }

      if (product.isPopular) score += 4;
      if (product.isNew) score += 2;
      if (product.badge) score += 1;

      if (budget) {
        if (product.priceRub <= budget) score += 7;
        else score -= Math.min(8, Math.ceil((product.priceRub - budget) / 3000));
      }

      return { product, score, index };
    })
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 18)
    .map((entry) => entry.product);
}

type ClientFallbackIntent = "greeting" | "service" | "care" | "delivery" | "bouquet";

function classifyClientFallbackIntent(message: string): ClientFallbackIntent {
  const lower = message.toLowerCase().trim();

  if (
    /^(привет|здравствуйте|здравствуй|добрый день|добрый вечер|доброе утро|хай|hello|hi)\b/.test(lower) &&
    lower.length <= 40
  ) {
    return "greeting";
  }

  if (
    /(относ|подход).{0,18}клиент/.test(lower) ||
    /как.{0,12}(вы|bellaflore).{0,18}работа/.test(lower) ||
    /почему.{0,18}(выбрать|вы|bellaflore)/.test(lower)
  ) {
    return "service";
  }

  if (/(уход|поливать|подрезать|хранить букет|дольше|долго.{0,10}сто)/.test(lower)) {
    return "care";
  }

  if (/(доставк|курьер)/.test(lower)) {
    return "delivery";
  }

  return "bouquet";
}

function buildFallbackText(message: string): string {
  const intent = classifyClientFallbackIntent(message);
  const lower = message.toLowerCase();

  if (intent === "greeting") {
    return "Здравствуйте! Я AI-флорист BellaFlore. Расскажите, для кого выбираете цветы или какой нужен совет.";
  }
  if (intent === "service") {
    return "В BellaFlore к каждому клиенту подходят внимательно и лично — подбираем букет под повод и вкус и остаёмся на связи. Могу помочь подобрать букет прямо сейчас.";
  }
  if (intent === "care") {
    return "Чтобы букет стоял дольше: подрезайте стебли под углом, меняйте воду каждые 1–2 дня и держите цветы вдали от батарей и солнца.";
  }
  if (intent === "delivery") {
    return "Точную стоимость и время доставки покажу на оформлении заказа по вашему адресу. Если хотите, для начала подберу букет.";
  }

  const firstMeeting =
    /перв(ое|ого|ая)?\s+(знакомств|встреч|свидан)|первое знакомство|первая встреча/.test(lower);

  if (firstMeeting) {
    return "Для первого знакомства лучше лёгкий и ненавязчивый букет: нежные оттенки, аккуратная форма и без слишком торжественной подачи. Если бюджет не принципиален, я начну с красивых вариантов среднего размера.";
  }
  if (!/жен|девуш|мам|муж|коллег|началь|себе/.test(lower)) {
    return "Кому выбираем цветы? Это поможет понять характер букета — романтичный, сдержанный, нежный или более эффектный.";
  }
  if (!/день рож|свидан|юбиле|свад|годовщ|спасибо|без повода|просто так|знакомств|встреч/.test(lower)) {
    return "А какой повод? От этого я точнее подберу форму букета и цветовую гамму.";
  }
  return "Назовите примерный бюджет и, если знаете, любимые цвета человека. После этого предложу несколько подходящих композиций.";
}

function clampLauncherPosition(x: number, y: number) {
  const size = window.innerWidth <= 640 ? 56 : 58;
  const margin = 10;
  const reservedBottom = window.innerWidth <= 640 ? 92 : 18;
  return {
    x: Math.min(
      Math.max(margin, x),
      Math.max(margin, window.innerWidth - size - margin),
    ),
    y: Math.min(
      Math.max(margin, y),
      Math.max(margin, window.innerHeight - size - reservedBottom),
    ),
  };
}

function snapLauncherToEdge(position: { x: number; y: number }) {
  const size = window.innerWidth <= 640 ? 56 : 58;
  const margin = 10;
  const leftDistance = position.x;
  const rightDistance = window.innerWidth - (position.x + size);
  const snappedX =
    leftDistance <= rightDistance
      ? margin
      : Math.max(margin, window.innerWidth - size - margin);

  return clampLauncherPosition(snappedX, position.y);
}

function readStoredChat(): ChatMessage[] | null {
  try {
    const raw = window.sessionStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const messages = parsed
      .filter(
        (message): message is ChatMessage =>
          Boolean(
            message &&
              typeof message.id === "string" &&
              (message.role === "user" || message.role === "assistant") &&
              typeof message.content === "string",
          ),
      )
      .slice(-CHAT_STORAGE_LIMIT);

    return messages.length > 0 ? messages : null;
  } catch {
    return null;
  }
}

function storeChat(messages: ChatMessage[]) {
  try {
    window.sessionStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify(messages.slice(-CHAT_STORAGE_LIMIT)),
    );
  } catch {
    // The conversation still works in memory if sessionStorage is unavailable.
  }
}


function readStoredDraftId(): string | null {
  try {
    const value = window.sessionStorage.getItem(DRAFT_STORAGE_KEY)?.trim();
    return value || null;
  } catch {
    return null;
  }
}

function storeDraftId(draftId: string) {
  try {
    window.sessionStorage.setItem(DRAFT_STORAGE_KEY, draftId);
  } catch {
    // Draft still works in memory when sessionStorage is unavailable.
  }
}

function clearStoredDraftId() {
  try {
    window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignore storage limitations.
  }
}

// A real keyboard opening on iOS typically shrinks the visual viewport by
// 250px+. Smaller shifts (browser chrome collapsing, URL bar) stay under
// this threshold so the panel doesn't jitter its position for those.
const KEYBOARD_INSET_THRESHOLD_PX = 80;

export function AiFlorist({
  bouquets,
  formatPrice,
  onProductOpen,
}: AiFloristProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [assistantMode, setAssistantMode] = useState<"ai" | "fallback" | null>(null);
  const [keyboardInset, setKeyboardInset] = useState<{ bottomGap: number; viewportHeight: number } | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const chatBodyRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const composerFocusedRef = useRef(false);
  const messageSequenceRef = useRef(1);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const [launcherPosition, setLauncherPosition] = useState<{ x: number; y: number } | null>(null);

  const nextMessageId = (prefix: "user" | "assistant") => {
    const sequence = messageSequenceRef.current;
    messageSequenceRef.current += 1;
    return `${prefix}-${sequence}`;
  };

  const productById = useMemo(
    () => new Map(bouquets.map((product) => [product.id, product])),
    [bouquets],
  );
  const conversationUserText = useMemo(
    () =>
      messages
        .filter((message) => message.role === "user")
        .map((message) => message.content)
        .join(" ")
        .toLowerCase(),
    [messages],
  );

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(() => {
      if (cancelled) return;
      const stored = readStoredChat();
      if (stored) {
        setMessages(stored);
        messageSequenceRef.current = stored.length + 1;
      }

      const storedDraftId = readStoredDraftId();
      if (storedDraftId) {
        setDraftId(storedDraftId);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    storeChat(messages);
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        const raw = window.localStorage.getItem("bellaflore:ai-florist-position");
        if (!raw) return;
        const parsed = JSON.parse(raw) as { x?: unknown; y?: unknown };
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setLauncherPosition(clampLauncherPosition(parsed.x, parsed.y));
        }
      } catch {
        // Keep the default bottom-right position if storage is unavailable.
      }
    });

    const handleResize = () => {
      setLauncherPosition((current) =>
        current ? clampLauncherPosition(current.x, current.y) : current,
      );
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // ==================================================
  // SECTION: IPHONE KEYBOARD / VISUAL VIEWPORT
  // РАЗДЕЛ: Адаптация к visualViewport при открытой клавиатуре
  //
  // Purpose (EN):
  // iOS Safari does not resize the layout viewport when the keyboard
  // opens — only the *visual* viewport shrinks. A plain `position: fixed`
  // panel stays pinned to the (unchanged) layout viewport bottom, which
  // is exactly the reported bug: composer hidden behind the keyboard.
  // window.visualViewport reports the real visible area; we track the
  // gap between it and the layout viewport and reposition the panel
  // above that gap only when it looks like a real keyboard (not just
  // browser chrome moving a little).
  // ==================================================
  useEffect(() => {
    if (!open) return;

    const visualViewport = window.visualViewport;
    if (!visualViewport) {
      return;
    }

    const update = () => {
      const bottomGap = Math.max(
        0,
        window.innerHeight - visualViewport.height - visualViewport.offsetTop,
      );
      setKeyboardInset(
        bottomGap > KEYBOARD_INSET_THRESHOLD_PX
          ? { bottomGap, viewportHeight: visualViewport.height }
          : null,
      );
    };

    update();
    visualViewport.addEventListener("resize", update);
    visualViewport.addEventListener("scroll", update);
    return () => {
      visualViewport.removeEventListener("resize", update);
      visualViewport.removeEventListener("scroll", update);
      setKeyboardInset(null);
    };
  }, [open]);

  const scrollChatToBottom = (behavior: ScrollBehavior = "smooth") => {
    const chatBody = chatBodyRef.current;
    if (chatBody) {
      chatBody.scrollTo({ top: chatBody.scrollHeight, behavior });
    }
  };

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      scrollChatToBottom("smooth");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, open, sending, keyboardInset]);

  // ==================================================
  // SECTION: OPEN / CLOSE UX
  // РАЗДЕЛ: Открытие и закрытие панели
  //
  // Desktop: mouse leaving the panel starts a ~700ms auto-close timer,
  // cancelled if the pointer returns or if the composer is focused.
  // Both desktop and mobile: outside click/tap, Escape, the × button and
  // re-tapping the launcher all close the panel. A touch ending INSIDE
  // the panel never closes it (the outside-click handler only reacts to
  // targets outside the panel), and the keyboard opening/closing never
  // triggers a close on its own.
  // ==================================================
  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  useEffect(() => clearCloseTimer, []);

  const handlePanelMouseEnter = () => {
    clearCloseTimer();
  };

  const handlePanelMouseLeave = () => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (composerFocusedRef.current) return;

    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      if (!composerFocusedRef.current) {
        setOpen(false);
      }
    }, 700);
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (launcherRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);



  // Управление scroll body при открытии modal на мобиле
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isMobile = window.innerWidth <= 640;
    if (!isMobile) return;

    if (open) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [open]);

  const ensureDraftId = async (): Promise<string | null> => {
    if (draftId) {
      return draftId;
    }

    const storedDraftId = readStoredDraftId();
    if (storedDraftId) {
      setDraftId(storedDraftId);
      return storedDraftId;
    }

    try {
      const response = await fetch("/api/order-drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });

      if (!response.ok) {
        return null;
      }

      const created = (await response.json()) as { id?: string };
      const createdDraftId = created.id?.trim() || null;

      if (createdDraftId) {
        setDraftId(createdDraftId);
        storeDraftId(createdDraftId);
      }

      return createdDraftId;
    } catch {
      return null;
    }
  };

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || sending) return;

    const userMessage: ChatMessage = {
      id: nextMessageId("user"),
      role: "user",
      content: text,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    window.requestAnimationFrame(() => scrollChatToBottom("smooth"));

    const activeDraftId = await ensureDraftId();
    const candidates = selectCandidates(bouquets, nextMessages);

    try {
      const response = await fetch("/api/ai-florist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: activeDraftId ?? undefined,
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          candidates: candidates.map((product) => ({
            id: product.id,
            title: product.title,
            priceRub: product.priceRub,
            category: product.category,
            flowerType: product.flowerType,
            description: product.description,
            tags: product.tags,
            sizes: product.sizes?.map((size) => ({
              label: size.label,
              price: size.price,
            })),
          })),
        }),
      });
      const body = (await response.json()) as ApiReply;
      if (body.mode === "ai" || body.mode === "fallback") {
        setAssistantMode(body.mode);
      }

      const assistantMessage: ChatMessage = {
        id: nextMessageId("assistant"),
        role: "assistant",
        content:
          response.ok && body.reply
            ? body.reply
            : buildFallbackText(text),
        recommendedProductIds: Array.isArray(body.recommendedProductIds)
          ? body.recommendedProductIds
          : [],
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch {
      setAssistantMode("fallback");
      setMessages((current) => [
        ...current,
        {
          id: nextMessageId("assistant"),
          role: "assistant",
          content: buildFallbackText(text),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    const previousDraftId = draftId ?? readStoredDraftId();

    setMessages([INITIAL_MESSAGE]);
    setDraftId(null);
    setInput("");
    clearStoredDraftId();

    try {
      window.sessionStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      // Ignore storage limitations.
    }

    if (previousDraftId) {
      void fetch(`/api/order-drafts?id=${encodeURIComponent(previousDraftId)}`, {
        method: "DELETE",
      }).catch(() => undefined);
    }
  };

  const saveLauncherPosition = (position: { x: number; y: number }) => {
    try {
      window.localStorage.setItem(
        "bellaflore:ai-florist-position",
        JSON.stringify(position),
      );
    } catch {
      // Dragging still works when localStorage is unavailable.
    }
  };

  const handleLauncherPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const origin = launcherPosition ?? { x: rect.left, y: rect.top };
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: origin.x,
      originY: origin.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleLauncherPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    const moved = drag.moved || Math.hypot(deltaX, deltaY) > 6;
    if (moved) {
      event.preventDefault();
    }

    dragRef.current = { ...drag, moved };
    setLauncherPosition(
      clampLauncherPosition(drag.originX + deltaX, drag.originY + deltaY),
    );
  };

  const finishLauncherDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (drag.moved) {
      suppressClickRef.current = true;
      setLauncherPosition((current) => {
        if (!current) return current;
        const snapped = snapLauncherToEdge(current);
        saveLauncherPosition(snapped);
        return snapped;
      });
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }

    dragRef.current = null;
  };

  const rootStyle = launcherPosition
    ? ({
        left: `${launcherPosition.x}px`,
        top: `${launcherPosition.y}px`,
        right: "auto",
        bottom: "auto",
      } satisfies CSSProperties)
    : undefined;

  const panelStyle: CSSProperties | undefined = keyboardInset
    ? {
        bottom: `${keyboardInset.bottomGap + 8}px`,
        maxHeight: `${Math.max(240, keyboardInset.viewportHeight - 96)}px`,
      }
    : undefined;

  return (
    <div className={styles.root} style={rootStyle}>
      {open ? (
        <section
          className={styles.panel}
          style={panelStyle}
          aria-label="AI-флорист BellaFlore"
          ref={panelRef}
          onMouseEnter={handlePanelMouseEnter}
          onMouseLeave={handlePanelMouseLeave}
        >
          <div className={styles.panelHeader}>
            <div className={styles.identity}>
              <span className={styles.smallMark} aria-hidden="true">
                ✦
              </span>
              <div>
                <strong>AI-флорист BellaFlore</strong>
                <span>Советы флориста · реальные товары</span>
              </div>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setOpen(false)}
              aria-label="Закрыть AI-флориста"
            >
              ×
            </button>
          </div>

          <div className={styles.chatBody} ref={chatBodyRef}>
            {messages.map((message, index) => {
              const recommended = (message.recommendedProductIds ?? [])
                .map((id) => productById.get(id))
                .filter(
                  (product): product is CatalogProduct =>
                    product !== undefined &&
                    !isExcludedByConversation(product, conversationUserText),
                );

              return (
                <div
                  className={
                    message.role === "user"
                      ? styles.userMessageGroup
                      : styles.assistantMessageGroup
                  }
                  key={message.id}
                >
                  <div
                    className={
                      message.role === "user"
                        ? styles.userBubble
                        : styles.assistantBubble
                    }
                  >
                    {renderMarkdownMessage(message.content)}
                  </div>

                  {recommended.length > 0 ? (
                    <div className={styles.recommendations}>
                      {recommended.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          className={styles.productCard}
                          onClick={() => {
                            onProductOpen?.(product.id);
                            setOpen(false);
                          }}
                        >
                          <span className={styles.productImage}>
                            <ProductImageWithFallback
                              src={product.src}
                              alt={product.alt}
                              width={product.width}
                              height={product.height}
                              sizes="70px"
                              imageClassName={styles.productImg}
                              fallbackClassName={styles.productFallback}
                            />
                          </span>
                          <span className={styles.productCopy}>
                            <strong>{product.title}</strong>
                            <span>{formatPrice(product.priceRub)}</span>
                            <small>Открыть композицию</small>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {index === 0 && messages.length === 1 ? (
                    <div className={styles.quickReplies}>
                      {QUICK_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => void sendMessage(prompt)}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}

            {sending ? (
              <div className={styles.thinking}>
                <span />
                <span />
                <span />
              </div>
            ) : null}

            <div ref={endRef} />
          </div>

          <form
            className={styles.composer}
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onFocus={() => {
                composerFocusedRef.current = true;
                clearCloseTimer();
                window.setTimeout(() => scrollChatToBottom("smooth"), 300);
              }}
              onBlur={() => {
                composerFocusedRef.current = false;
              }}
              placeholder="Напишите: для кого, повод, бюджет…"
              aria-label="Сообщение AI-флористу"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Отправить"
            >
              Отправить
            </button>
          </form>

          <div className={styles.panelFooter}>
            <button type="button" onClick={reset}>
              Новый подбор
            </button>
            <span>
              {assistantMode === "fallback"
                ? "Помощник временно работает в упрощённом режиме."
                : "AI использует только реальные товары BellaFlore."}
            </span>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        className={`${styles.launcher} ${open ? styles.launcherOpen : ""}`}
        ref={launcherRef}
        onPointerDown={handleLauncherPointerDown}
        onPointerMove={handleLauncherPointerMove}
        onPointerUp={finishLauncherDrag}
        onPointerCancel={finishLauncherDrag}
        onClick={() => {
          if (suppressClickRef.current) return;
          setOpen((current) => !current);
        }}
        aria-label={
          open ? "Закрыть AI-флориста" : "Открыть AI-флориста BellaFlore"
        }
        aria-expanded={open}
      >
        <span aria-hidden="true">✦</span>
      </button>
    </div>
  );
}
