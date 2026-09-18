"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "@/components/product/ProductReviews.module.css";

type PublicReview = {
  id: string;
  name: string;
  rating: number;
  text: string;
  createdAtDisplay: string;
};

type ProductReviewsProps = {
  productId: string;
  productTitle: string;
};

export function ProductReviews({
  productId,
  productTitle,
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadReviews = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/reviews?productId=${encodeURIComponent(productId)}`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as {
          reviews?: PublicReview[];
        };

        if (!cancelled && response.ok && Array.isArray(payload.reviews)) {
          setReviews(payload.reviews);
        }
      } catch {
        // Keep the product page usable if reviews are temporarily unavailable.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadReviews();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) {
      return null;
    }

    return (
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    );
  }, [reviews]);

  const submitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedName = name.trim();
    const normalizedText = text.trim();

    if (!normalizedName || !normalizedText) {
      setMessage("Заполните имя и текст отзыва.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: normalizedName,
          rating,
          text: normalizedText,
          productId,
        }),
      });

      const payload = (await response.json()) as {
        review?: PublicReview;
        published?: boolean;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Не удалось отправить отзыв.");
      }

      if (payload.published && payload.review) {
        setReviews((current) => [payload.review as PublicReview, ...current]);
      }

      setName("");
      setRating(5);
      setText("");
      setMessage(
        payload.message ||
          (payload.published
            ? "Спасибо! Отзыв опубликован."
            : "Спасибо! Отзыв отправлен на модерацию."),
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Не удалось отправить отзыв. Попробуйте ещё раз.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.section} aria-labelledby="product-reviews-title">
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Отзывы</p>
          <h2 id="product-reviews-title" className={styles.title}>
            Отзывы о букете «{productTitle}»
          </h2>
          <p className={styles.summary}>
            {averageRating === null
              ? "Пока нет опубликованных отзывов"
              : `★ ${averageRating.toFixed(1)} · ${reviews.length} ${reviews.length === 1 ? "отзыв" : "отзывов"}`}
          </p>
        </div>

        <button
          type="button"
          className={styles.openButton}
          onClick={() => setFormOpen((current) => !current)}
          aria-expanded={formOpen}
        >
          {formOpen ? "Закрыть" : "Оставить отзыв"}
        </button>
      </div>

      {formOpen ? (
        <form className={styles.form} onSubmit={submitReview}>
          <label className={styles.field}>
            <span>Имя</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              maxLength={80}
              required
              placeholder="Ваше имя"
            />
          </label>

          <div className={styles.field}>
            <span>Оценка</span>
            <div className={styles.stars} aria-label="Оценка от 1 до 5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value <= rating ? styles.starActive : styles.star}
                  onClick={() => setRating(value)}
                  aria-label={`${value} из 5`}
                  aria-pressed={rating === value}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <label className={styles.field}>
            <span>Отзыв</span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={1200}
              rows={4}
              required
              placeholder="Расскажите о букете и доставке"
            />
          </label>

          {message ? (
            <p className={styles.message} role="status">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={submitting}
          >
            {submitting ? "Отправляем…" : "Отправить отзыв"}
          </button>

          <p className={styles.moderationNote}>
            4–5★ публикуются автоматически. 1–3★ проходят модерацию.
          </p>
        </form>
      ) : message ? (
        <p className={styles.message} role="status">
          {message}
        </p>
      ) : null}

      <div className={styles.list}>
        {loading ? (
          <p className={styles.empty}>Загружаем отзывы…</p>
        ) : reviews.length === 0 ? (
          <p className={styles.empty}>
            Будьте первым, кто оставит отзыв об этом букете.
          </p>
        ) : (
          reviews.slice(0, 6).map((review) => (
            <article className={styles.reviewCard} key={review.id}>
              <div className={styles.reviewTop}>
                <div>
                  <strong>{review.name}</strong>
                  <span>{review.createdAtDisplay}</span>
                </div>
                <span
                  className={styles.reviewStars}
                  aria-label={`Оценка ${review.rating} из 5`}
                >
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </span>
              </div>
              <p>{review.text}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
