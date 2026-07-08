export const BOUQUET_DB_SETUP_HINT = [
  "Настройте DATABASE_URL в Vercel:",
  "1. Vercel Dashboard → Storage → Create Database → Postgres",
  "2. Подключите DATABASE_URL к проекту bellaflore",
  "3. Перезапустите production deploy",
].join("\n");

export function getBouquetDatabaseUrl(): string | null {
  const url =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim();
  return url || null;
}

export function isBouquetDatabaseConfigured(): boolean {
  return Boolean(getBouquetDatabaseUrl());
}

/** File JSON adapter — enabled until Postgres is configured. */
export function allowFileBouquetFallback(): boolean {
  if (getBouquetDatabaseUrl()) {
    return false;
  }

  return process.env.BOUQUET_ALLOW_FILE_FALLBACK !== "0";
}
