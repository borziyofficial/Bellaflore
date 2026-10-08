"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { ProductImageWithFallback } from "@/components/product/ProductImageWithFallback";
import type { CatalogProduct } from "@/data/catalogProducts";
import styles from "@/components/home/AiFlorist.module.css";
import { useBodyScrollLock } from "@/lib/ui/useBodyScrollLock";

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

const UNAVAILABLE_REPLY =
  "Сейчас не получается подобрать букеты из каталога: помощник временно недоступен. Конкретных товаров я не предлагаю — выберите композицию в каталоге.";

function clampLauncherPosition(x: number, y: number) {
  const size = window.innerWidth <= 768 ? 56 : 58;
  const margin = 10;
  const reservedBottom = window.innerWidth <= 768 ? 92 : 18;
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
  const size = window.innerWidth <= 768 ? 56 : 58;
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
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [assistantMode, setAssistantMode] = useState<"ai" | "fallback" | null>(null);
  const [keyboardInset, setKeyboardInset] = useState<{
    offsetTop: number;
    viewportHeight: number;
  } | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const chatBodyRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = useRef(false);
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

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    document.body.dataset.aiFloristOpen = "true";
    return () => {
      delete document.body.dataset.aiFloristOpen;
    };
  }, [open]);

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
          ? {
              offsetTop: visualViewport.offsetTop,
              viewportHeight: visualViewport.height,
            }
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

  // The workspace stays open until the customer closes it: ×, Escape,
  // or a click on the backdrop. Leaving the pointer does not close it.
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      const desktop =
        window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
        window.innerWidth > 768;
      const frame = window.requestAnimationFrame(() => {
        if (desktop) {
          inputRef.current?.focus();
        } else {
          closeButtonRef.current?.focus();
        }
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (wasOpenRef.current) {
      launcherRef.current?.focus();
    }
  }, [open]);

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

    const candidates = selectCandidates(bouquets, nextMessages);

    try {
      const response = await fetch("/api/ai-florist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
      const unavailable = !response.ok || body.mode === "fallback" || !body.reply;

      if (unavailable) {
        setAssistantMode("fallback");
        setMessages((current) => [
          ...current,
          {
            id: nextMessageId("assistant"),
            role: "assistant",
            content: UNAVAILABLE_REPLY,
            recommendedProductIds: [],
          },
        ]);
      } else {
        setAssistantMode("ai");
        setMessages((current) => [
          ...current,
          {
            id: nextMessageId("assistant"),
            role: "assistant",
            content: body.reply ?? "",
            recommendedProductIds: Array.isArray(body.recommendedProductIds)
              ? body.recommendedProductIds
              : [],
          },
        ]);
      }
    } catch {
      setAssistantMode("fallback");
      setMessages((current) => [
        ...current,
        {
          id: nextMessageId("assistant"),
          role: "assistant",
          content: UNAVAILABLE_REPLY,
          recommendedProductIds: [],
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setMessages([INITIAL_MESSAGE]);
    setInput("");
    try {
      window.sessionStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      // Ignore storage limitations.
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
        top: `${keyboardInset.offsetTop}px`,
        right: "0px",
        bottom: "auto",
        left: "0px",
        width: "100%",
        height: `${keyboardInset.viewportHeight}px`,
        maxHeight: `${keyboardInset.viewportHeight}px`,
        transform: "none",
      }
    : undefined;

  return (
    <div className={styles.root} style={rootStyle}>
      {open ? (
        <div
          className={styles.backdrop}
          onPointerDown={() => setOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {open ? (
        <section
          className={styles.panel}
          style={panelStyle}
          role="dialog"
          aria-modal="true"
          aria-label="AI-флорист BellaFlore"
          ref={panelRef}
        >
          <div className={styles.panelHeader}>
            <div className={styles.identity}>
              <span className={styles.smallMark} aria-hidden="true">
                ✦
              </span>
              <div>
                <strong>AI-флорист BellaFlore</strong>
                <span>
                  {assistantMode === "fallback"
                    ? "Подбор из каталога временно недоступен"
                    : "Советы флориста · реальные товары"}
                </span>
              </div>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              ref={closeButtonRef}
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
                    {message.content}
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
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onFocus={() => {
                window.setTimeout(() => scrollChatToBottom("smooth"), 300);
              }}
              placeholder="Напишите: для кого, повод, бюджет…"
              aria-label="Сообщение AI-флористу"
              autoComplete="off"
              autoCapitalize="sentences"
              enterKeyHint="send"
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
                ? "Конкретные товары сейчас не предлагаю."
                : assistantMode === "ai"
                  ? "AI использует только реальные товары BellaFlore."
                  : "Опишите повод и бюджет."}
            </span>
          </div>
        </section>
      ) : null}

      {open ? null : (
        <button
          type="button"
          className={styles.launcher}
          ref={launcherRef}
          onPointerDown={handleLauncherPointerDown}
          onPointerMove={handleLauncherPointerMove}
          onPointerUp={finishLauncherDrag}
          onPointerCancel={finishLauncherDrag}
          onClick={() => {
            if (suppressClickRef.current) return;
            setOpen(true);
          }}
          aria-label="Открыть AI-флориста BellaFlore"
          aria-expanded={false}
        >
          <span aria-hidden="true">✦</span>
        </button>
      )}
    </div>
  );
}
