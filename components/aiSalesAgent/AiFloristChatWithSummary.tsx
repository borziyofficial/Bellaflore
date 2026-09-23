"use client";

import { useState, useRef } from "react";
import { AiFloristChat } from "./AiFloristChat";
import { OrderDraftSummary } from "./OrderDraftSummary";
import styles from "./AiFloristChatWithSummary.module.css";

type OrderDraftData = {
  draftId: string;
  status: string;
  customer?: {
    name?: string;
    phone?: string;
  };
  recipient?: {
    name?: string;
    phone?: string;
  };
  delivery?: {
    address?: string;
    latitude?: number;
    longitude?: number;
    zoneId?: string;
    date?: string;
    interval?: string;
  };
  items: Array<{
    id: string;
    productId?: string;
    title: string;
    size?: "S" | "M" | "L" | "XL";
    price: number;
    quantity: number;
  }>;
  total: number;
  conversationTurns: number;
  createdAt: string;
  updatedAt: string;
};

type OrderConfirmationResult = {
  status: "ok" | "error";
  message?: string;
  orderNumber?: string;
  orderId?: string;
  total?: number;
  replayed?: boolean;
};

interface AiFloristChatWithSummaryProps {
  draftId?: string;
  onOrderConfirmed?: (draftId: string) => void;
}

export function AiFloristChatWithSummary({
  onOrderConfirmed,
}: AiFloristChatWithSummaryProps) {
  const [showSummary, setShowSummary] = useState(false);
  const [draftData, setDraftData] = useState<OrderDraftData | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<OrderConfirmationResult | null>(null);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const chatRef = useRef<any>(null);

  const loadDraftSummary = async (draftId: string) => {
    setIsLoadingSummary(true);
    setConfirmationResult(null);
    setConfirmationError(null);
    
    try {
      const response = await fetch("/api/ai-florist-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "get_draft_summary",
          params: { draftId },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to load draft summary");
      }

      const result = await response.json();
      if (result.status === "ok") {
        setDraftData(result.data);
        setShowSummary(true);
      }
    } catch (err) {
      console.error("Failed to load draft summary:", err);
      setConfirmationError("Не удалось загрузить сводку заказа");
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleShowSummary = async (draftId: string) => {
    await loadDraftSummary(draftId);
  };

  const handleConfirmOrder = async () => {
    if (!draftData) return;

    setIsConfirming(true);
    setConfirmationError(null);
    setConfirmationResult(null);

    try {
      const response = await fetch("/api/ai-florist-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "finalize_order_from_draft",
          params: { draftId: draftData.draftId },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || "Ошибка при оформлении заказа";
        throw new Error(errorMessage);
      }

      const result = (await response.json()) as {
        status: "ok" | "error";
        message?: string;
        data?: {
          message?: string;
          orderNumber?: string;
          orderId?: string;
          replayed?: boolean;
          order?: {
            total?: number;
          };
        };
      };

      if (result.status === "error") {
        setConfirmationError(result.message || "Ошибка при оформлении заказа");
        setConfirmationResult(null);
      } else {
        const normalized: OrderConfirmationResult = {
          status: "ok",
          message: result.data?.message,
          orderNumber: result.data?.orderNumber,
          orderId: result.data?.orderId,
          replayed: Boolean(result.data?.replayed),
          total: result.data?.order?.total,
        };

        if (!normalized.orderNumber) {
          throw new Error("Сервер не вернул номер созданного заказа");
        }

        setConfirmationResult(normalized);
        setConfirmationError(null);

        if (!normalized.replayed) {
          onOrderConfirmed?.(draftData.draftId);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ошибка при оформлении заказа";
      setConfirmationError(errorMessage);
      setConfirmationResult(null);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleEditDraft = () => {
    setShowSummary(false);
    setConfirmationResult(null);
    setConfirmationError(null);
    chatRef.current?.focusInput?.();
  };

  const handleNewOrder = async () => {
    setShowSummary(false);
    setConfirmationResult(null);
    setConfirmationError(null);
    setDraftData(null);
    chatRef.current?.focusInput?.();
  };

  return (
    <div className={styles.container}>
      <div className={styles.chatSection}>
        <AiFloristChat
          ref={chatRef}
          onShowSummary={handleShowSummary}
        />
      </div>

      {showSummary && draftData && (
        <div className={styles.summarySection}>
          {!confirmationResult ? (
            <>
              <OrderDraftSummary
                draft={draftData}
                onConfirm={handleConfirmOrder}
                onEdit={handleEditDraft}
                isLoading={isConfirming}
              />
              {confirmationError && (
                <div className={styles.errorMessage}>
                  ⚠️ {confirmationError}
                </div>
              )}
            </>
          ) : (
            <div className={styles.successSection}>
              {confirmationResult.replayed ? (
                <div className={styles.replayedMessage}>
                  <div className={styles.statusIcon}>✓</div>
                  <div className={styles.statusText}>
                    Заказ уже оформлен
                  </div>
                  <div className={styles.orderNumber}>
                    {confirmationResult.orderNumber}
                  </div>
                  {confirmationResult.total && (
                    <div className={styles.total}>
                      Сумма: {confirmationResult.total.toLocaleString('ru-RU')} ₽
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.successMessage}>
                  <div className={styles.statusIcon}>✓</div>
                  <div className={styles.statusText}>
                    Заказ оформлен успешно
                  </div>
                  <div className={styles.orderNumber}>
                    {confirmationResult.orderNumber}
                  </div>
                  {confirmationResult.total && (
                    <div className={styles.total}>
                      Сумма: {confirmationResult.total.toLocaleString('ru-RU')} ₽
                    </div>
                  )}
                  <button 
                    className={styles.newOrderButton}
                    onClick={handleNewOrder}
                  >
                    Создать новый заказ
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
