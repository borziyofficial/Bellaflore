export const CATALOG_DB_SETUP_HINT = [
  "Настройте DATABASE_URL в Vercel:",
  "1. Vercel Dashboard → Storage → Create Database → Postgres",
  "2. Подключите DATABASE_URL к проекту bellaflore",
  "3. Перезапустите production deploy",
].join("\n");

export function getDatabaseUrl(): string | null {
  const url =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim();
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
