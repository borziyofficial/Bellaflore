// ==================================================
// SECTION: REVIEWS
// РАЗДЕЛ: Отзывы
//
// Purpose (EN):
// Customer reviews summary, form, and review grid
//
// Назначение (RU):
// Блок отзывов: сводка, форма и список
// ==================================================
"use client";

import {
  type ChangeEvent as ReactChangeEvent,
  type FormEvent as ReactFormEvent,
} from "react";

type ReviewForm = {
  name: string;
  rating: number;
  text: string;
};

type BellafloreReview = ReviewForm & {
  id: string;
  createdAtDisplay: string;
};

type ReviewsSectionProps = {
  averageReviewRating: number;
  averageReviewRatingLabel: string;
  reviewsCount: number;
  reviewForm: ReviewForm;
  reviewFormMessage: string;
  reviews: BellafloreReview[];
  renderRatingStars: (rating: number) => string;
  handleReviewSubmit: (event: ReactFormEvent<HTMLFormElement>) => void;
  handleReviewFieldChange: (
    field: keyof ReviewForm,
    value: ReviewForm[keyof ReviewForm],
  ) => void;
};

export function ReviewsSection({
  averageReviewRating,
  averageReviewRatingLabel,
  reviewsCount,
  reviewForm,
  reviewFormMessage,
  reviews,
  renderRatingStars,
  handleReviewSubmit,
  handleReviewFieldChange,
}: ReviewsSectionProps) {
  return (
    <section id="reviews" className="reviews-section" aria-labelledby="reviews-title">
      {/* ==================================================
SECTION: REVIEWS
РАЗДЕЛ: Заголовок секции и примечание о демо-отзывах
Purpose (EN): Section header and demo disclaimer
Назначение (RU): Заголовок секции и примечание о демо-отзывах
================================================== */}
      <div className="section-header bf-reveal bf-reveal-up">
        <span>Отзывы</span>
        <h2 id="reviews-title">Отзывы клиентов</h2>
        <p className="reviews-demo-note">
          Локальные демо-отзывы для предпросмотра. Не являются проверенными
          отзывами реальных клиентов.
        </p>
      </div>

      <div className="reviews-shell">
        {/* ==================================================
SECTION: REVIEWS
РАЗДЕЛ: Карточки средней оценки и количества отзывов
Purpose (EN): Average rating and total count cards
Назначение (RU): Карточки средней оценки и количества отзывов
================================================== */}
        <div className="reviews-summary-card bf-reveal bf-reveal-fade">
          <div className="reviews-score">
            <span>Средняя оценка</span>
            <strong>{averageReviewRatingLabel}</strong>
            <p aria-label={`Средняя оценка ${averageReviewRatingLabel} из 5`}>
              {renderRatingStars(Math.round(averageReviewRating))}
            </p>
          </div>
          <div className="reviews-count-card">
            <span>Всего отзывов</span>
            <strong>{reviewsCount}</strong>
            <p>Локальные демо-отзывы до подключения модерации.</p>
          </div>
        </div>

        {/* ==================================================
SECTION: REVIEW FORM
РАЗДЕЛ: Форма отправки нового отзыва
Purpose (EN): Submit a new customer review
Назначение (RU): Форма отправки нового отзыва
================================================== */}
        <form className="review-form-card" onSubmit={handleReviewSubmit}>
          <div className="review-form-header">
            <span>Bellaflore Concierge</span>
            <h3>Оставить отзыв</h3>
          </div>
          <label className="review-field">
            <span>Имя</span>
            <input
              type="text"
              value={reviewForm.name}
              onChange={(event: ReactChangeEvent<HTMLInputElement>) =>
                handleReviewFieldChange("name", event.target.value)
              }
              placeholder="Ваше имя"
              autoComplete="name"
              required
            />
          </label>
          {/* ==================================================
SECTION: REVIEW STARS
РАЗДЕЛ: Интерактивный выбор оценки от 1 до 5
Purpose (EN): Interactive 1–5 star rating picker
Назначение (RU): Интерактивный выбор оценки от 1 до 5
================================================== */}
          <div className="review-field">
            <span>Оценка</span>
            <div className="review-rating-control" aria-label="Оценка от 1 до 5">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  type="button"
                  className={
                    rating <= reviewForm.rating
                      ? "review-rating-star active"
                      : "review-rating-star"
                  }
                  onClick={() => handleReviewFieldChange("rating", rating)}
                  aria-label={`${rating} из 5`}
                  aria-pressed={rating === reviewForm.rating}
                  key={rating}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <label className="review-field">
            <span>Текст отзыва</span>
            <textarea
              value={reviewForm.text}
              onChange={(event: ReactChangeEvent<HTMLTextAreaElement>) =>
                handleReviewFieldChange("text", event.target.value)
              }
              placeholder="Поделитесь впечатлением о букете и доставке"
              rows={4}
              required
            />
          </label>
          {reviewFormMessage && (
            <p className="review-form-message" role="status">
              {reviewFormMessage}
            </p>
          )}
          <button type="submit" className="buy-button review-submit-button">
            Оставить отзыв
          </button>
        </form>

        {/* ==================================================
SECTION: REVIEWS
РАЗДЕЛ: Пустое состояние или сетка карточек отзывов
Purpose (EN): Empty state or review card grid
Назначение (RU): Пустое состояние или сетка карточек отзывов
================================================== */}
        {reviews.length === 0 ? (
          <p className="reviews-empty">Пока нет отзывов</p>
        ) : (
          <div className="reviews-grid bf-reveal-stagger">
            {reviews.map((review) => (
              <article className="review-card bf-reveal-up" key={review.id}>
                <div className="review-card-header">
                  <div>
                    <span>{review.createdAtDisplay}</span>
                    {review.id.startsWith("demo-") && (
                      <span className="review-demo-badge">Локальный пример</span>
                    )}
                    <h3>{review.name}</h3>
                  </div>
                  <strong aria-label={`Оценка ${review.rating} из 5`}>
                    {renderRatingStars(review.rating)}
                  </strong>
                </div>
                <p>{review.text}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
