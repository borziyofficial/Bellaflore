"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import styles from "./AiFloristChat.module.css";

type ConversationTurn = {
  turn: number;
  timestamp: string;
  userMessage?: string;
  aiReply?: string;
  recommendedProductIds?: string[];
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendedProducts?: Array<{
    id: string;
    title: string;
    priceRub: number;
  }>;
};

interface AiFloristChatProps {
  onShowSummary?: (draftId: string) => void;
}

export const AiFloristChat = forwardRef<any, AiFloristChatProps>(
  function AiFloristChat({ onShowSummary }, ref) {
    const [messages, setMessages] = useState<Message[]>([
      {
        id: "initial",
        role: "assistant",
        content:
          "Здравствуйте! Я — AI-консультант BellaFlore. Помогу вам подобрать идеальный букет. Кому вы хотите подарить цветы?",
      },
    ]);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [draftId, setDraftId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [conversationState, setConversationState] = useState<{ turns: ConversationTurn[] }>({ turns: [] });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Expose focusInput through ref
    useImperativeHandle(ref, () => ({
      focusInput: () => {
        inputRef.current?.focus();
      },
    }));

    // Initialize draft on mount
    useEffect(() => {
      const initializeDraft = async () => {
        try {
          const response = await fetch("/api/order-drafts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "create" }),
          });

          if (!response.ok) {
            throw new Error("Failed to create draft");
          }

          const draft = await response.json();
          setDraftId(draft.id);
        } catch (err) {
          console.error("Failed to initialize draft:", err);
          setError("Не удалось инициализировать сеанс");
        }
      };

      initializeDraft();
    }, []);

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
      scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || loading || !draftId) return;

      // Add user message
      const userMessage: Message = {
        id: `user_${Date.now()}`,
        role: "user",
        content: input,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);
      setError(null);

      try {
        // Record user message in conversation state
        const newTurn: ConversationTurn = {
          turn: conversationState.turns.length,
          timestamp: new Date().toISOString(),
          userMessage: input,
        };

        const updatedState = {
          turns: [...conversationState.turns, newTurn],
        };

        // Update draft with user message
        await fetch("/api/order-drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            draftId,
            updates: {
              conversationState: updatedState,
            },
          }),
        }).catch((err) => console.error("Failed to update draft with user message:", err));

        // Call AI florist API
        const response = await fetch("/api/ai-florist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: messages
              .filter((m) => m.id !== "initial" || messages.length === 1)
              .map((m) => ({
                role: m.role,
                content: m.content,
              }))
              .concat([{ role: "user", content: input }]),
            candidates: [],
            draftId,
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            setError("Слишком много сообщений. Попробуйте немного позже.");
          } else {
            throw new Error("API error");
          }
          return;
        }

        const data = await response.json();

        // Fetch product details for recommended products
        const assistantMessage: Message = {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content: data.reply || "Извините, я не смог обработать ваш запрос.",
          recommendedProducts: data.recommendedProductIds?.length
            ? await Promise.all(
                data.recommendedProductIds.slice(0, 3).map(async (id: string) => {
                  try {
                    const res = await fetch("/api/ai-florist-tools", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        tool: "get_product",
                        params: { id },
                      }),
                    });

                    if (!res.ok) return null;
                    const result = await res.json();
                    return (
                      result.data && {
                        id: result.data.id,
                        title: result.data.title,
                        priceRub: result.data.priceRub,
                      }
                    );
                  } catch {
                    return null;
                  }
                }),
              ).then((products) => products.filter((p): p is any => p !== null))
            : undefined,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Update conversation state with AI reply
        const turnWithReply: ConversationTurn = {
          ...newTurn,
          aiReply: data.reply,
          recommendedProductIds: data.recommendedProductIds || [],
        };

        const finalState = {
          turns: [...conversationState.turns.slice(0, -1), turnWithReply],
        };

        setConversationState(finalState);

        // Update draft with AI response
        await fetch("/api/order-drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            draftId,
            updates: {
              conversationState: finalState,
            },
          }),
        }).catch((err) => console.error("Failed to update draft with AI reply:", err));
      } catch (err) {
        console.error("Error:", err);
        if (!error) {
          const errorMessage: Message = {
            id: `error_${Date.now()}`,
            role: "assistant",
            content: "Извините, произошла ошибка. Пожалуйста, попробуйте ещё раз.",
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>🌸 AI-консультант BellaFlore</h2>
          <p className={styles.subtitle}>Подберу для вас идеальный букет</p>
          {draftId && <p className={styles.draftId}>ID сеанса: {draftId.slice(0, 8)}...</p>}
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <div className={styles.messagesContainer}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.message} ${styles[`message_${message.role}`]}`}
            >
              {message.role === "assistant" && <div className={styles.avatar}>🌸</div>}
              <div className={styles.content}>
                <p className={styles.text}>{message.content}</p>
                {message.recommendedProducts && (
                  <div className={styles.products}>
                    {message.recommendedProducts.map((product) => (
                      <div key={product.id} className={styles.productCard}>
                        <p className={styles.productTitle}>{product.title}</p>
                        {product.priceRub > 0 && (
                          <p className={styles.productPrice}>
                            {product.priceRub.toLocaleString("ru-RU")} ₽
                          </p>
                        )}
                        <button
                          className={styles.selectButton}
                          onClick={() =>
                            setInput(
                              `Выбираю "${product.title}" (${product.priceRub.toLocaleString("ru-RU")} ₽)`,
                            )
                          }
                        >
                          Выбрать
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {message.role === "user" && <div className={styles.avatar}>👤</div>}
            </div>
          ))}
          {loading && (
            <div className={`${styles.message} ${styles.message_assistant}`}>
              <div className={styles.avatar}>🌸</div>
              <div className={styles.content}>
                <div className={styles.typing}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className={styles.inputForm}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Напишите, что вы ищете..."
            disabled={loading || !draftId}
            className={styles.input}
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !draftId}
            className={styles.sendButton}
          >
            Отправить
          </button>
          {draftId && onShowSummary && (
            <button
              type="button"
              className={styles.summaryButton}
              onClick={() => onShowSummary(draftId)}
            >
              📋 Сводка
            </button>
          )}
        </form>
      </div>
    );
  }
);
