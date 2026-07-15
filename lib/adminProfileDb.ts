// ==================================================
// SECTION: Admin profile & store settings — real persistence
// РАЗДЕЛ: Профиль администратора и настройки магазина
// ==================================================
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";
import { getDatabaseUrl } from "@/lib/catalogDb/config";

export type AdminProfileRecord = {
  displayName: string;
  email: string;
  passwordHash: string;
  passwordUpdatedAt: string;
  storeName: string;
  storePhone: string;
  storeEmail: string;
  storeTelegram: string;
  storeWhatsapp: string;
  storeAddress: string;
  updatedAt: string;
};

const DEFAULT_PROFILE: AdminProfileRecord = {
  displayName: "",
  email: "",
  passwordHash: "",
  passwordUpdatedAt: "",
  storeName: "",
  storePhone: "",
  storeEmail: "",
  storeTelegram: "",
  storeWhatsapp: "",
  storeAddress: "",
  updatedAt: new Date(0).toISOString(),
};

type ProfileRow = {
  display_name: string;
  email: string;
  password_hash: string;
  password_updated_at: string | Date | null;
  store_name: string;
  store_phone: string;
  store_email: string;
  store_telegram: string;
  store_whatsapp: string;
  store_address: string;
  updated_at: string | Date;
};

const DATA_DIR = join(process.cwd(), ".data");
const DATA_FILE = join(DATA_DIR, "admin-profile.json");

let sqlClient: ReturnType<typeof postgres> | null = null;
let schemaReady: Promise<void> | null = null;

function getSqlClient() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    return null;
  }
  if (!sqlClient) {
    sqlClient = postgres(databaseUrl, { max: 2 });
  }
  return sqlClient;
}

async function ensureSchema(): Promise<void> {
  const sql = getSqlClient();
  if (!sql) {
    return;
  }
  if (!schemaReady) {
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS admin_profile_settings (
        id TEXT PRIMARY KEY DEFAULT 'default',
        display_name TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        password_hash TEXT NOT NULL DEFAULT '',
        password_updated_at TIMESTAMPTZ,
        store_name TEXT NOT NULL DEFAULT '',
        store_phone TEXT NOT NULL DEFAULT '',
        store_email TEXT NOT NULL DEFAULT '',
        store_telegram TEXT NOT NULL DEFAULT '',
        store_whatsapp TEXT NOT NULL DEFAULT '',
        store_address TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `.then(() => undefined);
  }
  await schemaReady;
}

function rowToRecord(row: ProfileRow): AdminProfileRecord {
  return {
    displayName: row.display_name,
    email: row.email,
    passwordHash: row.password_hash,
    passwordUpdatedAt: row.password_updated_at ? new Date(row.password_updated_at).toISOString() : "",
    storeName: row.store_name,
    storePhone: row.store_phone,
    storeEmail: row.store_email,
    storeTelegram: row.store_telegram,
    storeWhatsapp: row.store_whatsapp,
    storeAddress: row.store_address,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function readFileProfile(): Promise<AdminProfileRecord> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<AdminProfileRecord>;
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(DEFAULT_PROFILE, null, 2), "utf8");
    return DEFAULT_PROFILE;
  }
}

async function writeFileProfile(profile: AdminProfileRecord): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(profile, null, 2), "utf8");
}

export async function getAdminProfile(): Promise<AdminProfileRecord> {
  const sql = getSqlClient();
  if (!sql) {
    return readFileProfile();
  }

  await ensureSchema();
  const rows = await sql<ProfileRow[]>`
    SELECT * FROM admin_profile_settings WHERE id = 'default' LIMIT 1
  `;
  return rows[0] ? rowToRecord(rows[0]) : DEFAULT_PROFILE;
}

export type AdminProfileUpdateInput = Partial<
  Omit<AdminProfileRecord, "updatedAt" | "passwordHash" | "passwordUpdatedAt">
>;

async function persistProfile(next: AdminProfileRecord): Promise<AdminProfileRecord> {
  const sql = getSqlClient();
  if (!sql) {
    await writeFileProfile(next);
    return next;
  }

  await ensureSchema();
  const rows = await sql<ProfileRow[]>`
    INSERT INTO admin_profile_settings (
      id, display_name, email, password_hash, password_updated_at,
      store_name, store_phone, store_email, store_telegram, store_whatsapp, store_address, updated_at
    ) VALUES (
      'default', ${next.displayName}, ${next.email}, ${next.passwordHash},
      ${next.passwordUpdatedAt || null},
      ${next.storeName}, ${next.storePhone}, ${next.storeEmail}, ${next.storeTelegram}, ${next.storeWhatsapp}, ${next.storeAddress}, ${next.updatedAt}
    )
    ON CONFLICT (id) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      email = EXCLUDED.email,
      password_hash = EXCLUDED.password_hash,
      password_updated_at = EXCLUDED.password_updated_at,
      store_name = EXCLUDED.store_name,
      store_phone = EXCLUDED.store_phone,
      store_email = EXCLUDED.store_email,
      store_telegram = EXCLUDED.store_telegram,
      store_whatsapp = EXCLUDED.store_whatsapp,
      store_address = EXCLUDED.store_address,
      updated_at = EXCLUDED.updated_at
    RETURNING *
  `;
  return rows[0] ? rowToRecord(rows[0]) : next;
}

export async function updateAdminProfile(
  patch: AdminProfileUpdateInput,
): Promise<AdminProfileRecord> {
  const current = await getAdminProfile();
  const next: AdminProfileRecord = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  return persistProfile(next);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyStoredPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) {
    return false;
  }
  try {
    const derived = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    if (derived.length !== expected.length) {
      return false;
    }
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export class PasswordChangeError extends Error {}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
): Promise<AdminProfileRecord> {
  if (!newPassword || newPassword.trim().length < 8) {
    throw new PasswordChangeError("Новый пароль должен содержать минимум 8 символов.");
  }

  const profile = await getAdminProfile();
  const envPassword = process.env.ADMIN_PASSWORD?.trim() || "";

  const currentIsValid = profile.passwordHash
    ? verifyStoredPassword(currentPassword, profile.passwordHash)
    : Boolean(envPassword) && currentPassword.trim() === envPassword;

  if (!currentIsValid) {
    throw new PasswordChangeError("Текущий пароль указан неверно.");
  }

  const next: AdminProfileRecord = {
    ...profile,
    passwordHash: hashPassword(newPassword.trim()),
    passwordUpdatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return persistProfile(next);
}
