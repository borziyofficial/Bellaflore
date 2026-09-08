"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  type AdminOrder,
  fetchAdminOrder,
  formatOrderDate,
  formatOrderPrice,
  orderStatusLabels,
  paymentMethodLabel,
  paymentStatusLabels,
  updateAdminOrderStatus,
} from "@/lib/orders/adminClient";
import { AdminModuleHeader, AdminPanel } from "@/components/adminApp/shared/AdminModuleUi";
import ui from "@/components/adminApp/shared/AdminModuleUi.module.css";
import styles from "@/components/adminApp/modules/orders/AdminOrdersModule.module.css";

export function AdminOrderDetailsModule({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCancellation, setShowCancellation] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      setOrder(await fetchAdminOrder(orderId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Не удалось загрузить заказ.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  async function changeStatus(status: "CONFIRMED" | "CANCELLED", reason?: string) {
    if (!order) return;
    setSaving(true);
    setMessage("");
    setErrorMessage("");
    const previousPaymentStatus = order.paymentStatus;
    try {
      const updated = await updateAdminOrderStatus(order.id, status, reason);
      if (updated.paymentStatus !== previousPaymentStatus) {
        throw new Error("Статус оплаты неожиданно изменился. Обновление не принято интерфейсом.");
      }
      setOrder(updated);
      setShowCancellation(false);
      setCancellationReason("");
      setMessage(status === "CONFIRMED" ? "Заказ принят и подтверждён." : "Заказ отменён.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Не удалось обновить статус.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadOrder(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadOrder]);

  return (
    <div className={ui.stack}>
      <AdminModuleHeader
        title="Детали заказа"
        subtitle={order?.orderNumber ?? "Production Orders DB"}
        action={<Link className={ui.actionButton} href="/admin/orders">← К заказам</Link>}
      />

      {errorMessage ? <p className={styles.error} role="alert">{errorMessage}</p> : null}
      {message ? <p className={styles.success} role="status">{message}</p> : null}

      <AdminPanel title={loading ? "Загружаем заказ…" : "Полная информация"}>
        {!order ? (
          loading ? <div className={ui.emptyZone}>Загрузка…</div> : null
        ) : (
          <article className={styles.detail} aria-label={`Детали заказа ${order.orderNumber}`}>
            <div className={styles.detailHeader}>
              <div>
                <p className={styles.eyebrow}>Номер заказа</p>
                <h3>{order.orderNumber}</h3>
                <p>{order.id}</p>
              </div>
              <div className={styles.statusSummary}>
                <span><small>Статус заказа</small><strong>{orderStatusLabels[order.status]}</strong></span>
                <span><small>Статус оплаты</small><strong>{paymentStatusLabels[order.paymentStatus]}</strong></span>
              </div>
            </div>

            <div className={styles.actions} aria-label="Действия с заказом">
              <button
                type="button"
                className={styles.acceptButton}
                disabled={saving || order.status !== "NEW"}
                onClick={() => void changeStatus("CONFIRMED")}
              >
                {saving ? "Сохраняем…" : "Принять заказ"}
              </button>
              <button
                type="button"
                className={styles.rejectButton}
                disabled={saving || order.status === "CANCELLED" || order.status === "DELIVERED"}
                onClick={() => setShowCancellation(true)}
              >
                Отклонить заказ
              </button>
            </div>

            {showCancellation ? (
              <form
                className={styles.cancellationForm}
                onSubmit={(event) => {
                  event.preventDefault();
                  void changeStatus("CANCELLED", cancellationReason);
                }}
              >
                <label htmlFor="cancellation-reason">Причина отмены</label>
                <textarea
                  id="cancellation-reason"
                  value={cancellationReason}
                  minLength={3}
                  maxLength={500}
                  required
                  autoFocus
                  onChange={(event) => setCancellationReason(event.target.value)}
                  placeholder="Например: клиент отменил заказ"
                />
                <div>
                  <button type="submit" className={styles.rejectButton} disabled={saving || cancellationReason.trim().length < 3}>Подтвердить отмену</button>
                  <button type="button" className={styles.secondaryButton} disabled={saving} onClick={() => setShowCancellation(false)}>Не отменять</button>
                </div>
              </form>
            ) : null}

            <dl className={styles.facts}>
              <div><dt>Создан</dt><dd>{formatOrderDate(order.createdAt)}</dd></div>
              <div><dt>Обновлён</dt><dd>{formatOrderDate(order.updatedAt)}</dd></div>
              <div><dt>Клиент</dt><dd>{order.customer.name}</dd></div>
              <div><dt>Телефон клиента</dt><dd><a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a></dd></div>
              <div><dt>Получатель</dt><dd>{order.recipient.name}</dd></div>
              <div><dt>Телефон получателя</dt><dd><a href={`tel:${order.recipient.phone}`}>{order.recipient.phone}</a></dd></div>
              <div><dt>Адрес</dt><dd>{order.delivery.address}</dd></div>
              <div><dt>Доставка</dt><dd>{order.delivery.date} · {order.delivery.interval}</dd></div>
              <div><dt>Зона</dt><dd>{order.delivery.zoneId}</dd></div>
              <div><dt>Способ оплаты</dt><dd>{paymentMethodLabel(order.paymentMethod)}</dd></div>
              <div><dt>Статус оплаты</dt><dd>{paymentStatusLabels[order.paymentStatus]}</dd></div>
              <div><dt>Комментарий</dt><dd>{order.customerComment || "—"}</dd></div>
              {order.cancellationReason ? <div><dt>Причина отмены</dt><dd>{order.cancellationReason}</dd></div> : null}
            </dl>

            <div className={styles.items}>
              <h4>Состав заказа</h4>
              {order.items.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  <div><strong>{item.name}</strong><span>{item.productSlug} · размер {item.size}</span></div>
                  <div><span>{item.quantity} × {formatOrderPrice(item.unitPrice)}</span><strong>{formatOrderPrice(item.lineTotal)}</strong></div>
                </div>
              ))}
            </div>

            <dl className={styles.totals}>
              <div><dt>Товары</dt><dd>{formatOrderPrice(order.subtotal)}</dd></div>
              <div><dt>Доставка</dt><dd>{formatOrderPrice(order.deliveryCost)}</dd></div>
              <div><dt>Итого</dt><dd>{formatOrderPrice(order.total)}</dd></div>
            </dl>
          </article>
        )}
      </AdminPanel>
    </div>
  );
}
