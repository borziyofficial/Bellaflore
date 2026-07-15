// ==================================================
// SECTION: Admin API — Profile & store settings
// ==================================================
import {
  getAdminProfile,
  updateAdminProfile,
  type AdminProfileUpdateInput,
} from "@/lib/adminProfileDb";
import {
  isAdminRequestAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/adminApiAuth";
import type { AdminProfileRecord } from "@/lib/adminProfileDb";

export const runtime = "nodejs";

function toSafeProfile(profile: AdminProfileRecord) {
  return {
    displayName: profile.displayName,
    email: profile.email,
    storeName: profile.storeName,
    storePhone: profile.storePhone,
    storeEmail: profile.storeEmail,
    storeTelegram: profile.storeTelegram,
    storeWhatsapp: profile.storeWhatsapp,
    storeAddress: profile.storeAddress,
    hasCustomPassword: Boolean(profile.passwordHash),
  };
}
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const profile = await getAdminProfile();
    return Response.json(
      {
        profile: toSafeProfile(profile),
        envUsername: process.env.ADMIN_USERNAME?.trim() || "",
      },
      { headers: { "Cache-Control": "no-store, must-revalidate" } },
    );
  } catch {
    return Response.json({ message: "Не удалось загрузить профиль." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = (await request.json()) as { profile?: AdminProfileUpdateInput };
    if (!body.profile || typeof body.profile !== "object") {
      return Response.json({ message: "Некорректные данные профиля." }, { status: 400 });
    }

    const patch: AdminProfileUpdateInput = {};
    const fields: Array<keyof AdminProfileUpdateInput> = [
      "displayName",
      "email",
      "storeName",
      "storePhone",
      "storeEmail",
      "storeTelegram",
      "storeWhatsapp",
      "storeAddress",
    ];
    for (const field of fields) {
      const value = body.profile[field];
      if (typeof value === "string") {
        patch[field] = value.trim();
      }
    }

    const profile = await updateAdminProfile(patch);
    return Response.json({ profile: toSafeProfile(profile) });
  } catch {
    return Response.json({ message: "Не удалось сохранить профиль." }, { status: 500 });
  }
}
