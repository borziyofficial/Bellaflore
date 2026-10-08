import "server-only";

import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";
import { getDatabaseUrl } from "@/lib/catalogDb/config";

export type ReviewStatus = "approved" | "pending" | "rejected";

export type ReviewRecord = {
  id: string;
  name: string;
  rating: number;
  text: string;
  status: ReviewStatus;
  productId: string | null;
  createdAt: string;
  updatedAt: string;
};

type ReviewRow = {
  id: string;
  name: string;
  rating: number;
  body: string;
  status: ReviewStatus;
  product_id: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export class ReviewStorageNotConfiguredError extends Error {
  constructor() {
    super("Хранилище отзывов не настроено.");
    this.name = "ReviewStorageNotConfiguredError";
  }
}

const LOCAL_REVIEWS_FILE = join(process.cwd(), ".data", "storefront-reviews.json");

let sqlClient: ReturnType<typeof postgres> | null = null;
let schemaPromise: Promise<void> | null = null;

function isReviewStatus(value: unknown): value is ReviewStatus {
  return value === "approved" || value === "pending" || value === "rejected";
}

function isStoredReview(value: unknown): value is ReviewRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const review = value as Partial<ReviewRecord>;
  return (
    typeof review.id === "string" &&
    typeof review.name === "string" &&
    typeof review.rating === "number" &&
    Number.isInteger(review.rating) &&
    review.rating >= 1 &&
    review.rating <= 5 &&
    typeof review.text === "string" &&
    isReviewStatus(review.status) &&
    (typeof review.productId === "string" || review.productId === null) &&
    typeof review.createdAt === "string" &&
    typeof review.updatedAt === "string"
  );
}

async function readLocalReviews(): Promise<ReviewRecord[] | undefined> {
  if (getDatabaseUrl()) {
    return undefined;
  }

  try {
    const raw = await readFile(LOCAL_REVIEWS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      throw new ReviewStorageNotConfiguredError();
    }

    return parsed.filter(isStoredReview);
  } catch (error) {
    if (error instanceof ReviewStorageNotConfiguredError) {
      throw error;
    }

    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new ReviewStorageNotConfiguredError();
    }

    throw error;
  }
}

function sortByCreatedDesc(reviews: ReviewRecord[]): ReviewRecord[] {
  return [...reviews].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

function getReviewsSqlClient(): ReturnType<typeof postgres> {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new ReviewStorageNotConfiguredError();
  }

  if (!sqlClient) {
    sqlClient = postgres(databaseUrl, {
      max: 3,
      connect_timeout: 10,
      idle_timeout: 20,
    });
  }

  return sqlClient;
}

async function ensureReviewsSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const sql = getReviewsSqlClient();
      await sql`
        CREATE TABLE IF NOT EXISTS storefront_reviews (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
          body TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('approved', 'pending', 'rejected')),
          product_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_storefront_reviews_status_created
        ON storefront_reviews(status, created_at DESC)
      `;
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  return schemaPromise;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapReview(row: ReviewRow): ReviewRecord {
  return {
    id: row.id,
    name: row.name,
    rating: Number(row.rating),
    text: row.body,
    status: row.status,
    productId: row.product_id,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function createReview(input: {
  name: string;
  rating: number;
  text: string;
  productId?: string | null;
}): Promise<ReviewRecord> {
  await ensureReviewsSchema();
  const sql = getReviewsSqlClient();
  const status: ReviewStatus = "pending";
  const id = randomUUID();

  const rows = await sql<ReviewRow[]>`
    INSERT INTO storefront_reviews (
      id, name, rating, body, status, product_id
    )
    VALUES (
      ${id},
      ${input.name},
      ${input.rating},
      ${input.text},
      ${status},
      ${input.productId ?? null}
    )
    RETURNING *
  `;

  return mapReview(rows[0]);
}

export async function listApprovedReviews(
  productId: string | null = null,
  limit = 100,
): Promise<ReviewRecord[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 200);
  const localReviews = await readLocalReviews();
  if (localReviews) {
    return sortByCreatedDesc(
      localReviews.filter(
        (review) =>
          review.status === "approved" &&
          (productId ? review.productId === productId : true),
      ),
    ).slice(0, safeLimit);
  }

  await ensureReviewsSchema();
  const sql = getReviewsSqlClient();
  const rows = productId
    ? await sql<ReviewRow[]>`
        SELECT *
        FROM storefront_reviews
        WHERE status = 'approved' AND product_id = ${productId}
        ORDER BY created_at DESC
        LIMIT ${safeLimit}
      `
    : await sql<ReviewRow[]>`
        SELECT *
        FROM storefront_reviews
        WHERE status = 'approved'
        ORDER BY created_at DESC
        LIMIT ${safeLimit}
      `;
  return rows.map(mapReview);
}

export async function listAdminReviews(limit = 200): Promise<ReviewRecord[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 500);
  const localReviews = await readLocalReviews();
  if (localReviews) {
    const statusOrder: Record<ReviewStatus, number> = {
      pending: 0,
      approved: 1,
      rejected: 2,
    };
    return [...localReviews]
      .sort((left, right) => {
        const statusDiff = statusOrder[left.status] - statusOrder[right.status];
        if (statusDiff !== 0) {
          return statusDiff;
        }
        return right.createdAt.localeCompare(left.createdAt);
      })
      .slice(0, safeLimit);
  }

  await ensureReviewsSchema();
  const sql = getReviewsSqlClient();
  const rows = await sql<ReviewRow[]>`
    SELECT *
    FROM storefront_reviews
    ORDER BY
      CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
      created_at DESC
    LIMIT ${safeLimit}
  `;
  return rows.map(mapReview);
}

export async function setReviewStatus(
  id: string,
  status: Extract<ReviewStatus, "approved" | "rejected">,
): Promise<ReviewRecord | null> {
  await ensureReviewsSchema();
  const sql = getReviewsSqlClient();
  const rows = await sql<ReviewRow[]>`
    UPDATE storefront_reviews
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? mapReview(rows[0]) : null;
}
