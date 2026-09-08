// ==================================================
// SECTION: DATABASE CONFIGURATION
// РАЗДЕЛ: Конфигурация БД
//
// Purpose (EN): Get database connection URL from environment.
// Назначение (RU): Получить URL подключения БД из environment.
// ==================================================

export const CATALOG_DB_SETUP_HINT = [
  "Настройте DATABASE_URL в Vercel:",
  "1. Vercel Dashboard → Storage → Create Database → Postgres",
  "2. Подключите DATABASE_URL к проекту bellaflore",
  "3. Перезапустите production deploy",
].join("\n");

/**
 * Returns the DATABASE_URL from environment, or null if not set.
 * In production, prefers pooled connection strings (POSTGRES_POOLED_URL or
 * DATABASE_POOLED_URL) for Vercel serverless compatibility. Safe to call
 * from server components/routes.
 */
export function getDatabaseUrl(): string | null {
  // Production: prefer pooled connections for Vercel serverless
  if (process.env.NODE_ENV === "production") {
    const pooled = (process.env.POSTGRES_POOLED_URL?.trim() || 
                   process.env.DATABASE_POOLED_URL?.trim());
    if (pooled) {
      return pooled;
    }
  }
  
  // Fallback chain: DATABASE_URL, POSTGRES_URL, POSTGRES_PRISMA_URL
  const url = (process.env.DATABASE_URL?.trim() || 
               process.env.POSTGRES_URL?.trim() ||
               process.env.POSTGRES_PRISMA_URL?.trim());
  return url || null;
}

export function isCatalogDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

export function allowFileCatalogFallback(): boolean {
  if (getDatabaseUrl()) {
    return false;
  }

  return process.env.NODE_ENV !== "production";
}
