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
    <section className="reviews-section" aria-labelledby="reviews-title">
      <div className="section-header">
        <span>Отзывы</span>
        <h2 id="reviews-title">Отзывы клиентов</h2>
      </div>

      <div className="reviews-shell">
        <div className="reviews-summary-card">
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
            <p>Отзывы сохраняются локально до подключения модерации.</p>
          </div>
        </div>

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

        {reviews.length === 0 ? (
          <p className="reviews-empty">Пока нет отзывов</p>
        ) : (
          <div className="reviews-grid">
            {reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div className="review-card-header">
                  <div>
                    <span>{review.createdAtDisplay}</span>
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
