"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./AiFloristChat.module.css";

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

export function AiFloristChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "assistant",
      content: "Здравствуйте! Я — AI-консультант BellaFlore. Помогу вам подобрать идеальный букет. Кому вы хотите подарить цветы?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Add user message
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
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
        }),
      });

      if (!response.ok) {
        throw new Error("API error");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: data.reply || "Извините, я не смог обработать ваш запрос.",
        recommendedProducts: data.recommendedProductIds?.length
          ? [
              {
                id: data.recommendedProductIds[0],
                title: "Рекомендуемый товар",
                priceRub: 0,
              },
            ]
          : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: "assistant",
        content: "Извините, произошла ошибка. Пожалуйста, попробуйте ещё раз.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>🌸 AI-консультант BellaFlore</h2>
        <p className={styles.subtitle}>
          Подберу для вас идеальный букет
        </p>
      </div>

      <div className={styles.messagesContainer}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${styles[`message_${message.role}`]}`}
          >
            {message.role === "assistant" && (
              <div className={styles.avatar}>🌸</div>
            )}
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
                    </div>
                  ))}
                </div>
              )}
            </div>
            {message.role === "user" && (
              <div className={styles.avatar}>👤</div>
            )}
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
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Напишите, что вы ищете..."
          disabled={loading}
          className={styles.input}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className={styles.sendButton}
        >
          Отправить
        </button>
      </form>
    </div>
  );
}
