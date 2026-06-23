export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export type ReviewModerationStatus = "pending" | "approved" | "rejected";

export type ReviewPhoto = {
  id: string;
  url: string;
  alt: string;
};

export type BouquetReviewSubmission = {
  bouquetId: string;
  visitorName: string;
  rating: ReviewRating;
  text: string;
  photo?: ReviewPhoto;
  captchaToken?: string;
  userId?: string;
  orderId?: string;
};

export type BouquetReview = BouquetReviewSubmission & {
  id: string;
  createdAt: string;
  moderationStatus: ReviewModerationStatus;
  moderatedAt?: string;
  moderationComment?: string;
};

export type BouquetReviewSummary = {
  bouquetId: string;
  averageRating: number;
  approvedReviewCount: number;
};

export type ReviewValidationResult = {
  valid: boolean;
  errors: string[];
};

export const reviewModerationStatusLabels: Record<
  ReviewModerationStatus,
  string
> = {
  pending: "На модерации",
  approved: "Одобрен",
  rejected: "Отклонён",
};

export const mockBouquetReviews: BouquetReview[] = [
  {
    id: "review-001",
    bouquetId: "pink-elegance",
    visitorName: "Анна",
    rating: 5,
    text: "Очень нежный букет, доставили аккуратно и вовремя.",
    createdAt: "2026-06-13T11:00:00.000Z",
    moderationStatus: "approved",
    moderatedAt: "2026-06-13T11:20:00.000Z",
  },
  {
    id: "review-002",
    bouquetId: "pink-elegance",
    visitorName: "Мария",
    rating: 4,
    text: "Красиво собран, фото полностью совпало с ожиданиями.",
    createdAt: "2026-06-13T12:00:00.000Z",
    moderationStatus: "pending",
  },
  {
    id: "review-003",
    bouquetId: "white-pearl",
    visitorName: "Екатерина",
    rating: 5,
    text: "Белые розы выглядели свежо и очень торжественно.",
    createdAt: "2026-06-13T13:00:00.000Z",
    moderationStatus: "approved",
    moderatedAt: "2026-06-13T13:15:00.000Z",
  },
];

export function getReviewModerationStatusText(
  status: ReviewModerationStatus,
): string {
  return reviewModerationStatusLabels[status];
}

export function getApprovedReviews(reviews: BouquetReview[]): BouquetReview[] {
  return reviews.filter((review) => review.moderationStatus === "approved");
}

export function createPendingGuestReview(
  submission: BouquetReviewSubmission,
  id: string,
  createdAt: string,
): BouquetReview {
  return {
    ...submission,
    id,
    createdAt,
    moderationStatus: "pending",
  };
}

export function getApprovedReviewsForBouquet(
  reviews: BouquetReview[],
  bouquetId: string,
): BouquetReview[] {
  return getApprovedReviews(reviews).filter(
    (review) => review.bouquetId === bouquetId,
  );
}

export function getAverageRating(reviews: BouquetReview[]): number {
  const approvedReviews = getApprovedReviews(reviews);

  if (approvedReviews.length === 0) return 0;

  const ratingTotal = approvedReviews.reduce(
    (total, review) => total + review.rating,
    0,
  );

  return Number((ratingTotal / approvedReviews.length).toFixed(1));
}

export function getBouquetReviewSummary(
  reviews: BouquetReview[],
  bouquetId: string,
): BouquetReviewSummary {
  const approvedReviews = getApprovedReviewsForBouquet(reviews, bouquetId);

  return {
    bouquetId,
    averageRating: getAverageRating(approvedReviews),
    approvedReviewCount: approvedReviews.length,
  };
}

export function approveReview(
  review: BouquetReview,
  moderatedAt: string,
): BouquetReview {
  return {
    ...review,
    moderationStatus: "approved",
    moderatedAt,
  };
}

export function rejectReview(
  review: BouquetReview,
  moderatedAt: string,
  moderationComment?: string,
): BouquetReview {
  return {
    ...review,
    moderationStatus: "rejected",
    moderatedAt,
    moderationComment,
  };
}

export function deleteReview(
  reviews: BouquetReview[],
  reviewId: string,
): BouquetReview[] {
  return reviews.filter((review) => review.id !== reviewId);
}

export function validateReviewSubmission(
  submission: BouquetReviewSubmission,
): ReviewValidationResult {
  const errors: string[] = [];
  const visitorName = submission.visitorName.trim();
  const text = submission.text.trim();

  if (visitorName.length < 2) {
    errors.push("Укажите имя длиной не менее 2 символов");
  }

  if (text.length < 10) {
    errors.push("Отзыв должен быть не короче 10 символов");
  }

  if (text.length > 1000) {
    errors.push("Отзыв должен быть не длиннее 1000 символов");
  }

  if (submission.rating < 1 || submission.rating > 5) {
    errors.push("Оценка должна быть от 1 до 5");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
