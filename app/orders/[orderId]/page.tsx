// ==================================================
// SECTION: My Order — Order Details Page
// РАЗДЕЛ: Мой заказ — страница деталей заказа
//
// Purpose (EN): Client page for a single order — details, status management, payment proof preview, and line items.
//
// Назначение (RU): Клиентская страница одного заказа — детали, управление статусом, превью чека и позиции.
// ==================================================

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  type BackendOrder,
  type BackendOrderItem,
  type OrderStatus,
  formatDate,
  formatPrice,
  getOrdersUrl,
  orderStatusLabels,
  paymentStatusLabels,
} from "../orderUtils";

const orderStatusOptions: OrderStatus[] = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "COURIER_ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const imageFilePattern = /\.(avif|gif|jpe?g|png|webp)$/i;

function getOrderIdParam(orderId: string | string[] | undefined): string {
  if (Array.isArray(orderId)) {
    return orderId[0] ?? "";
  }

  return orderId ?? "";
}

function formatItemQuantity(quantity: number | undefined): string {
  if (typeof quantity !== "number" || Number.isNaN(quantity)) {
    return "1 шт.";
  }

  return `${quantity} шт.`;
}

function getItemPrice(item: BackendOrderItem): string {
  if (typeof item.lineTotalRub === "number") {
    return formatPrice(item.lineTotalRub);
  }

  if (
    typeof item.priceRub === "number" &&
    typeof item.quantity === "number" &&
    !Number.isNaN(item.quantity)
  ) {
    return formatPrice(item.priceRub * item.quantity);
  }

  if (typeof item.priceRub === "number") {
    return formatPrice(item.priceRub);
  }

  return "Цена не указана";
}

function getPaymentProofImageSrc(fileName: string | null): string {
  if (!fileName || !imageFilePattern.test(fileName)) {
    return "";
  }

  if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
    return fileName;
  }

  if (fileName.startsWith("/")) {
    return fileName;
  }

  return `/payment-proofs/${encodeURIComponent(fileName)}`;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = useMemo(
    () => getOrderIdParam(params.orderId),
    [params.orderId],
  );
  const [order, setOrder] = useState<BackendOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<OrderStatus | "">("");
  const [failedProofPreviewFileName, setFailedProofPreviewFileName] = useState<
    string | null
  >(null);

  useEffect(() => {
    let ignore = false;

    const loadOrder = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(getOrdersUrl(), { cache: "no-store" });

        if (!response.ok) {
          throw new Error(`Orders request failed: ${response.status}`);
        }

        const loadedOrders = (await response.json()) as BackendOrder[];
        const foundOrder =
          loadedOrders.find((currentOrder) => currentOrder.order_id === orderId) ??
          null;

        if (!ignore) {
          setOrder(foundOrder);
        }
      } catch {
        if (!ignore) {
          setErrorMessage("Не удалось загрузить заказ из backend API.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadOrder();

    return () => {
      ignore = true;
    };
  }, [orderId]);

  const updateOrderStatus = async (orderStatus: OrderStatus) => {
    if (!order || order.order_status === orderStatus) {
      return;
    }

    setUpdatingStatus(orderStatus);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await fetch(
        `${getOrdersUrl()}/${encodeURIComponent(order.order_id)}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ order_status: orderStatus }),
        },
      );

      if (!response.ok) {
        throw new Error(`Order status request failed: ${response.status}`);
      }

      const updatedOrder = (await response.json()) as BackendOrder;
      setOrder(updatedOrder);
      setStatusMessage("Статус обновлён");
    } catch {
      setErrorMessage("Не удалось обновить статус заказа.");
    } finally {
      setUpdatingStatus("");
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <Link href="/orders" style={styles.backLink}>
          Назад к заказам
        </Link>
        <p style={styles.eyebrow}>BellaFlore</p>
        <h1 style={styles.title}>Детали заказа</h1>
      </section>

      {errorMessage && <p style={styles.error}>{errorMessage}</p>}
      {loading && <p style={styles.muted}>Загрузка заказа...</p>}
      {!loading && !order && !errorMessage && (
        <p style={styles.muted}>Заказ не найден.</p>
      )}

      {order && (
        <article style={styles.card}>
          {(() => {
            const paymentProofFileName = order.payment_proof_file_name;
            const paymentProofImageSrc =
              getPaymentProofImageSrc(paymentProofFileName);
            const canShowPaymentProofPreview =
              Boolean(paymentProofImageSrc) &&
              failedProofPreviewFileName !== paymentProofFileName;

            return (
              <>
          <div style={styles.orderHeader}>
            <div>
              <span style={styles.label}>Номер заказа</span>
              <h2 style={styles.orderNumber}>{order.order_id}</h2>
            </div>
            <span style={styles.createdDate}>{formatDate(order.created_at)}</span>
          </div>

          <dl style={styles.detailsGrid}>
            <div style={styles.detailItem}>
              <dt style={styles.label}>Клиент</dt>
              <dd style={styles.value}>{order.customer_name}</dd>
            </div>
            <div style={styles.detailItem}>
              <dt style={styles.label}>Телефон</dt>
              <dd style={styles.value}>{order.customer_phone}</dd>
            </div>
            <div style={styles.detailItem}>
              <dt style={styles.label}>Сумма</dt>
              <dd style={styles.value}>{formatPrice(order.total_price)}</dd>
            </div>
            <div style={styles.detailItem}>
              <dt style={styles.label}>Способ оплаты</dt>
              <dd style={styles.value}>{order.payment_method}</dd>
            </div>
            <div style={styles.detailItem}>
              <dt style={styles.label}>Статус оплаты</dt>
              <dd style={styles.value}>
                {paymentStatusLabels[order.payment_status]}
              </dd>
            </div>
            <div style={styles.detailItem}>
              <dt style={styles.label}>Статус заказа</dt>
              <dd style={styles.value}>{orderStatusLabels[order.order_status]}</dd>
            </div>
            <div style={styles.detailItem}>
              <dt style={styles.label}>Дата создания</dt>
              <dd style={styles.value}>{formatDate(order.created_at)}</dd>
            </div>
          </dl>

          <section style={styles.statusPanel} aria-label="Управление статусом заказа">
            <div style={styles.statusPanelHeader}>
              <div>
                <span style={styles.label}>Текущий статус</span>
                <p style={styles.currentStatus}>
                  {orderStatusLabels[order.order_status]}
                </p>
              </div>
              {statusMessage && (
                <span style={styles.statusMessage}>{statusMessage}</span>
              )}
            </div>

            <div style={styles.statusButtonGrid}>
              {orderStatusOptions.map((status) => {
                const isActive = order.order_status === status;
                const isUpdating = updatingStatus === status;

                return (
                  <button
                    type="button"
                    key={status}
                    style={{
                      ...styles.statusButton,
                      ...(isActive ? styles.activeStatusButton : null),
                    }}
                    onClick={() => void updateOrderStatus(status)}
                    disabled={Boolean(updatingStatus) || isActive}
                    aria-pressed={isActive}
                  >
                    {isUpdating ? "Обновление..." : orderStatusLabels[status]}
                  </button>
                );
              })}
            </div>
          </section>

          <section style={styles.paymentProofPanel} aria-label="Чек оплаты">
            <div style={styles.paymentProofDetails}>
              <div style={styles.paymentProofHeader}>
                <div>
                  <span style={styles.label}>Чек оплаты</span>
                  <h3 style={styles.paymentProofTitle}>Платёжное подтверждение</h3>
                </div>
                <span
                  style={{
                    ...styles.proofStatusBadge,
                    ...(paymentProofFileName ? styles.proofUploadedBadge : null),
                  }}
                >
                  {paymentProofFileName ? "Чек загружен" : "Чек не загружен"}
                </span>
              </div>

              <dl style={styles.paymentProofGrid}>
                <div style={styles.detailItem}>
                  <dt style={styles.label}>Файл</dt>
                  <dd style={styles.value}>
                    {paymentProofFileName ?? "Чек не загружен"}
                  </dd>
                </div>
                <div style={styles.detailItem}>
                  <dt style={styles.label}>Статус загрузки</dt>
                  <dd style={styles.value}>
                    {paymentProofFileName ? "Загружен" : "Чек не загружен"}
                  </dd>
                </div>
                <div style={styles.detailItem}>
                  <dt style={styles.label}>Дата загрузки</dt>
                  <dd style={styles.value}>
                    {order.payment_proof_uploaded_at
                      ? formatDate(order.payment_proof_uploaded_at)
                      : "Дата не указана"}
                  </dd>
                </div>
              </dl>
            </div>

            <div style={styles.paymentProofPreview}>
              <span style={styles.label}>Предпросмотр</span>
              {canShowPaymentProofPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={paymentProofImageSrc}
                  alt={`Чек оплаты ${paymentProofFileName}`}
                  style={styles.proofImage}
                  onError={() =>
                    setFailedProofPreviewFileName(paymentProofFileName)
                  }
                />
              ) : (
                <div style={styles.proofPlaceholder}>
                  {paymentProofFileName
                    ? "Предпросмотр недоступен"
                    : "Чек не загружен"}
                </div>
              )}
            </div>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Состав заказа</h3>
            {order.items.length === 0 ? (
              <p style={styles.emptyText}>Позиции заказа не указаны.</p>
            ) : (
              <div style={styles.itemList}>
                {order.items.map((item, index) => (
                  <div
                    style={styles.itemRow}
                    key={`${item.bouquetId ?? item.bouquetName ?? "item"}-${index}`}
                  >
                    <div style={styles.itemMain}>
                      <span style={styles.itemName}>
                        {item.bouquetName ?? "Букет"}
                      </span>
                      <span style={styles.itemMeta}>
                        {formatItemQuantity(item.quantity)}
                      </span>
                    </div>
                    <span style={styles.itemPrice}>{getItemPrice(item)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {order.comment.trim() && (
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Комментарий клиента</h3>
              <p style={styles.comment}>{order.comment}</p>
            </section>
          )}
              </>
            );
          })()}
        </article>
      )}
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    background: "#f7f2ea",
    color: "#2f2a24",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    width: "min(980px, 100%)",
    margin: "0 auto 22px",
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "40px",
    marginBottom: "14px",
    border: "1px solid rgba(138, 107, 61, 0.24)",
    borderRadius: "8px",
    padding: "0 14px",
    background: "#fffaf2",
    color: "#6f5128",
    fontSize: "14px",
    fontWeight: 800,
    textDecoration: "none",
    WebkitTapHighlightColor: "rgba(138, 107, 61, 0.16)",
  },
  eyebrow: {
    margin: 0,
    color: "#8a6b3d",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    margin: "4px 0 0",
    fontSize: "clamp(32px, 6vw, 52px)",
    lineHeight: 1,
  },
  error: {
    width: "min(980px, 100%)",
    margin: "0 auto 16px",
    border: "1px solid rgba(176, 42, 42, 0.28)",
    borderRadius: "8px",
    padding: "12px 14px",
    background: "#fff1f1",
    color: "#8e2020",
  },
  muted: {
    width: "min(980px, 100%)",
    margin: "0 auto 16px",
    color: "#75695c",
  },
  card: {
    width: "min(980px, 100%)",
    margin: "0 auto",
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    padding: "20px",
    background: "#ffffff",
    boxShadow: "0 12px 34px rgba(47, 42, 36, 0.08)",
  },
  orderHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  orderNumber: {
    margin: "2px 0 0",
    fontSize: "28px",
    lineHeight: 1.1,
  },
  createdDate: {
    color: "#75695c",
    fontSize: "14px",
    textAlign: "right",
  },
  detailsGrid: {
    margin: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "12px",
  },
  detailItem: {
    minWidth: 0,
  },
  label: {
    display: "block",
    marginBottom: "4px",
    color: "#8a6b3d",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  value: {
    margin: 0,
    color: "#2f2a24",
    overflowWrap: "anywhere",
    fontSize: "16px",
    lineHeight: 1.35,
  },
  statusPanel: {
    marginTop: "22px",
    border: "1px solid rgba(138, 107, 61, 0.22)",
    borderRadius: "8px",
    padding: "16px",
    background:
      "linear-gradient(135deg, rgba(255, 250, 242, 0.98), rgba(247, 242, 234, 0.72))",
  },
  statusPanelHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "14px",
    flexWrap: "wrap",
  },
  currentStatus: {
    margin: 0,
    color: "#2f2a24",
    fontSize: "20px",
    fontWeight: 900,
    lineHeight: 1.2,
  },
  statusMessage: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "32px",
    border: "1px solid rgba(35, 106, 50, 0.26)",
    borderRadius: "999px",
    padding: "0 12px",
    background: "rgba(235, 247, 235, 0.86)",
    color: "#236a32",
    fontSize: "13px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  statusButtonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "10px",
  },
  statusButton: {
    minHeight: "44px",
    border: "1px solid rgba(138, 107, 61, 0.28)",
    borderRadius: "8px",
    padding: "10px 12px",
    background: "#ffffff",
    color: "#5f4725",
    cursor: "pointer",
    font: "inherit",
    fontSize: "14px",
    fontWeight: 850,
    lineHeight: 1.2,
    textAlign: "center",
    boxShadow: "0 8px 18px rgba(47, 42, 36, 0.06)",
  },
  activeStatusButton: {
    border: "1px solid #2f2a24",
    background: "#2f2a24",
    color: "#fffaf2",
    cursor: "default",
    boxShadow: "0 10px 22px rgba(47, 42, 36, 0.14)",
  },
  paymentProofPanel: {
    marginTop: "22px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
    gap: "14px",
    border: "1px solid rgba(138, 107, 61, 0.22)",
    borderRadius: "8px",
    padding: "16px",
    background: "#fffaf2",
  },
  paymentProofDetails: {
    minWidth: 0,
  },
  paymentProofHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "14px",
    flexWrap: "wrap",
  },
  paymentProofTitle: {
    margin: "2px 0 0",
    color: "#2f2a24",
    fontSize: "20px",
    lineHeight: 1.2,
  },
  proofStatusBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "32px",
    border: "1px solid rgba(138, 107, 61, 0.24)",
    borderRadius: "999px",
    padding: "0 12px",
    background: "#ffffff",
    color: "#75695c",
    fontSize: "13px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  proofUploadedBadge: {
    border: "1px solid rgba(35, 106, 50, 0.26)",
    background: "#e9f7ea",
    color: "#236a32",
  },
  paymentProofGrid: {
    margin: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "12px",
  },
  paymentProofPreview: {
    minWidth: 0,
    display: "grid",
    alignContent: "start",
    gap: "8px",
  },
  proofImage: {
    width: "100%",
    maxWidth: "100%",
    maxHeight: "360px",
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    background: "#ffffff",
    objectFit: "contain",
    boxShadow: "0 10px 26px rgba(47, 42, 36, 0.08)",
  },
  proofPlaceholder: {
    minHeight: "180px",
    display: "grid",
    placeItems: "center",
    border: "1px dashed rgba(138, 107, 61, 0.28)",
    borderRadius: "8px",
    padding: "18px",
    background: "#ffffff",
    color: "#75695c",
    fontSize: "15px",
    fontWeight: 800,
    textAlign: "center",
  },
  section: {
    marginTop: "24px",
    borderTop: "1px solid rgba(138, 107, 61, 0.18)",
    paddingTop: "18px",
  },
  sectionTitle: {
    margin: "0 0 12px",
    color: "#2f2a24",
    fontSize: "20px",
    lineHeight: 1.2,
  },
  emptyText: {
    margin: 0,
    color: "#75695c",
  },
  itemList: {
    display: "grid",
    gap: "10px",
  },
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    border: "1px solid rgba(138, 107, 61, 0.14)",
    borderRadius: "8px",
    padding: "12px",
    background: "#fffaf2",
  },
  itemMain: {
    minWidth: 0,
    display: "grid",
    gap: "3px",
  },
  itemName: {
    color: "#2f2a24",
    fontSize: "16px",
    fontWeight: 800,
    overflowWrap: "anywhere",
  },
  itemMeta: {
    color: "#75695c",
    fontSize: "14px",
  },
  itemPrice: {
    flex: "0 0 auto",
    color: "#6f5128",
    fontSize: "16px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  comment: {
    margin: 0,
    color: "#2f2a24",
    fontSize: "16px",
    lineHeight: 1.55,
    overflowWrap: "anywhere",
  },
};
