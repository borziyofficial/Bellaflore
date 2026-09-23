"use client";

import { useState, useRef, useEffect } from "react";
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
  };
  items: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  conversationTurns: number;
  createdAt: string;
  updatedAt: string;
};

interface AiFloristChatWithSummaryProps {
  draftId?: string;
  onOrderConfirmed?: (draftId: string) => void;
}

export function AiFloristChatWithSummary({
  draftId: initialDraftId,
  onOrderConfirmed,
}: AiFloristChatWithSummaryProps) {
  const [showSummary, setShowSummary] = useState(false);
  const [draftData, setDraftData] = useState<OrderDraftData | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const chatRef = useRef<any>(null);

  const loadDraftSummary = async (draftId: string) => {
    setIsLoadingSummary(true);
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
    try {
      // Convert draft to actual order
      // This would typically call a finalize_order_from_draft tool
      const response = await fetch("/api/ai-florist-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "finalize_order_from_draft",
          params: { draftId: draftData.draftId },
        }),
      });

      if (response.ok) {
        onOrderConfirmed?.(draftData.draftId);
      }
    } catch (err) {
      console.error("Failed to confirm order:", err);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleEditDraft = () => {
    setShowSummary(false);
    // Focus back to chat input
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
          <OrderDraftSummary
            draft={draftData}
            onConfirm={handleConfirmOrder}
            onEdit={handleEditDraft}
            isLoading={isConfirming}
          />
        </div>
      )}
    </div>
  );
}
