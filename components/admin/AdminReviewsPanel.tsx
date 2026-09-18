"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ui from "@/components/adminApp/shared/AdminModuleUi.module.css";

type ReviewStatus = "approved" | "pending" | "rejected";

type AdminReview = {
  id: string;
  name: string;
  rating: number;
  text: string;
  status: ReviewStatus;
  productId: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_LABELS: Record<ReviewStatus, string> = {
  approved: "Опубликован",
  pending: "На модерации",
  rejected: "Отклонён",
};

export function AdminReviewsPanel() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/reviews", { cache: "no-store" });
      const payload = (await response.json()) as {
        reviews?: AdminReview[];
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Не удалось загрузить отзывы.");
      }

      setReviews(Array.isArray(payload.reviews) ? payload.reviews : []);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Не удалось загрузить отзывы.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const pendingCount = useMemo(
    () => reviews.filter((review) => review.status === "pending").length,
    [reviews],
  );

  const moderate = async (reviewId: string, action: "approve" | "reject") => {
    setBusyId(reviewId);
    setMessage("");

    try {
      const response = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: reviewId, action }),
      });
      const payload = (await response.json()) as {
        review?: AdminReview;
        message?: string;
      };

      if (!response.ok || !payload.review) {
        throw new Error(payload.message || "Не удалось изменить статус отзыва.");
      }

      const updatedReview = payload.review;
      setReviews((current) =>
        current.map((review) =>
          review.id === updatedReview.id ? updatedReview : review,
        ),
      );
      setMessage(action === "approve" ? "Отзыв опубликован." : "Отзыв отклонён.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Не удалось изменить статус отзыва.",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className={ui.stack}>
      <div className={ui.header}>
        <div>
          <h1 className={ui.title}>Отзывы</h1>
          <p className={ui.subtitle}>
            4–5★ публикуются автоматически. 1–3★ ждут решения администратора.
          </p>
        </div>
        <button
          type="button"
          className={ui.actionButton}
          onClick={() => void loadReviews()}
          disabled={loading}
        >
          Обновить
        </button>
      </div>

      <div className={ui.statGrid}>
        <div className={ui.statCard}>
          <p className={ui.statLabel}>На модерации</p>
          <p className={ui.statValue}>{pendingCount}</p>
        </div>
        <div className={ui.statCard}>
          <p className={ui.statLabel}>Всего</p>
          <p className={ui.statValue}>{reviews.length}</p>
        </div>
      </div>

      {message ? <p className={ui.futureNote}>{message}</p> : null}

      {loading ? (
        <div className={ui.emptyZone}>Загрузка отзывов…</div>
      ) : reviews.length === 0 ? (
        <div className={ui.emptyZone}>Отзывов пока нет.</div>
      ) : (
        <ul className={ui.list}>
          {reviews.map((review) => (
            <li className={ui.listItem} key={review.id}>
              <div>
                <strong>{review.name}</strong>
                <div className={ui.listItemMuted}>
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)} · {STATUS_LABELS[review.status]}
                  {review.productId ? ` · Букет ${review.productId}` : " · Общий отзыв"}
                </div>
                <div>{review.text}</div>
              </div>
              {review.status === "pending" ? (
                <div className={ui.stack}>
                  <button
                    type="button"
                    className={ui.actionButton}
                    disabled={busyId === review.id}
                    onClick={() => void moderate(review.id, "approve")}
                  >
                    Опубликовать
                  </button>
                  <button
                    type="button"
                    className={`${ui.actionButton} ${ui.actionButtonSecondary}`}
                    disabled={busyId === review.id}
                    onClick={() => void moderate(review.id, "reject")}
                  >
                    Отклонить
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
