"use client";

import { useState } from "react";
import styles from "./OrderDraftSummary.module.css";

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

interface OrderDraftSummaryProps {
  draft: OrderDraftData;
  onConfirm: () => void;
  onEdit: () => void;
  isLoading?: boolean;
}

export function OrderDraftSummary({
  draft,
  onConfirm,
  onEdit,
  isLoading = false,
}: OrderDraftSummaryProps) {
  const [showDetails, setShowDetails] = useState(false);

  const isCompleteForOrder = !!(
    draft.customer?.name &&
    draft.customer?.phone &&
    draft.recipient?.name &&
    draft.delivery?.address &&
    draft.items?.length > 0
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>📋 Сводка заказа</h3>
        <p className={styles.subtitle}>Проверьте детали перед подтверждением</p>
      </div>

      <div className={styles.summary}>
        {/* Items Section */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>🌸 Букеты</h4>
          {draft.items && draft.items.length > 0 ? (
            <div className={styles.itemsList}>
              {draft.items.map((item) => (
                <div key={item.id} className={styles.item}>
                  <span className={styles.itemTitle}>{item.title}</span>
                  <span className={styles.itemQty}>x{item.quantity}</span>
                  <span className={styles.itemPrice}>
                    {(item.price * item.quantity).toLocaleString("ru-RU")} ₽
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>Букеты не выбраны</p>
          )}
        </div>

        {/* Customer Section */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>👤 Заказчик</h4>
          <div className={styles.detail}>
            <span className={styles.label}>Имя:</span>
            <span className={styles.value}>{draft.customer?.name || "—"}</span>
          </div>
          <div className={styles.detail}>
            <span className={styles.label}>Телефон:</span>
            <span className={styles.value}>{draft.customer?.phone || "—"}</span>
          </div>
        </div>

        {/* Recipient Section */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>🎁 Получатель</h4>
          <div className={styles.detail}>
            <span className={styles.label}>Имя:</span>
            <span className={styles.value}>{draft.recipient?.name || "—"}</span>
          </div>
          <div className={styles.detail}>
            <span className={styles.label}>Телефон:</span>
            <span className={styles.value}>{draft.recipient?.phone || "—"}</span>
          </div>
        </div>

        {/* Delivery Section */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>🚚 Доставка</h4>
          <div className={styles.detail}>
            <span className={styles.label}>Адрес:</span>
            <span className={styles.value}>{draft.delivery?.address || "—"}</span>
          </div>
          <div className={styles.detail}>
            <span className={styles.label}>Зона доставки:</span>
            <span className={styles.value}>{draft.delivery?.zoneId || "—"}</span>
          </div>
        </div>

        {/* Total Section */}
        <div className={styles.totalSection}>
          <span className={styles.totalLabel}>Итого:</span>
          <span className={styles.totalValue}>
            {draft.total.toLocaleString("ru-RU")} ₽
          </span>
        </div>
      </div>

      {/* Status Indicator */}
      {!isCompleteForOrder && (
        <div className={styles.warning}>
          ⚠️ Заполните все обязательные поля для оформления заказа
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button
          className={styles.editButton}
          onClick={onEdit}
          disabled={isLoading}
        >
          ✏️ Редактировать
        </button>
        <button
          className={`${styles.confirmButton} ${!isCompleteForOrder ? styles.disabled : ""}`}
          onClick={onConfirm}
          disabled={!isCompleteForOrder || isLoading}
        >
          {isLoading ? "⏳ Обработка..." : "✅ Подтвердить заказ"}
        </button>
      </div>

      {/* Details Toggle */}
      <div className={styles.detailsToggle}>
        <button
          className={styles.toggleLink}
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? "▼ Скрыть детали" : "▶ Показать детали"}
        </button>
      </div>

      {showDetails && (
        <div className={styles.details}>
          <p className={styles.detailText}>
            <strong>ID черновика:</strong> {draft.draftId}
          </p>
          <p className={styles.detailText}>
            <strong>Статус:</strong> {draft.status}
          </p>
          <p className={styles.detailText}>
            <strong>Диалогов:</strong> {draft.conversationTurns}
          </p>
          <p className={styles.detailText}>
            <strong>Создано:</strong> {new Date(draft.createdAt).toLocaleString("ru-RU")}
          </p>
        </div>
      )}
    </div>
  );
}
