"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { ProductImageWithFallback } from "@/components/product/ProductImageWithFallback";
import type { CatalogProduct } from "@/data/catalogProducts";
import styles from "@/components/home/AiFlorist.module.css";

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
  message?: string;
};

const QUICK_PROMPTS = [
  "Букет для жены",
  "Маме на день рождения",
  "Нужен совет до 10 000 ₽",
  "Какие цветы дольше стоят?",
];

const CHAT_STORAGE_KEY = "bellaflore:ai-florist-chat-v1";
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

function buildFallbackText(message: string): string {
  const lower = message.toLowerCase();
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

export function AiFlorist({
  bouquets,
  formatPrice,
  onProductOpen,
}: AiFloristProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, open, sending]);

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

  return (
    <div className={styles.root} style={rootStyle}>
      {open ? (
        <section className={styles.panel} aria-label="AI-флорист BellaFlore">
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

          <div className={styles.chatBody}>
            {messages.map((message, index) => {
              const recommended = (message.recommendedProductIds ?? [])
                .map((id) => productById.get(id))
                .filter((product): product is CatalogProduct => Boolean(product));

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
              value={input}
              onChange={(event) => setInput(event.target.value)}
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
            <span>AI использует только реальные товары BellaFlore.</span>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        className={`${styles.launcher} ${open ? styles.launcherOpen : ""}`}
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
