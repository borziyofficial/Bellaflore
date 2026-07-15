// ==================================================
// SECTION: Admin API — Change admin password
// ==================================================
import { PasswordChangeError, changeAdminPassword } from "@/lib/adminProfileDb";
import {
  isAdminRequestAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/adminApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = (await request.json()) as {
      currentPassword?: unknown;
      newPassword?: unknown;
    };

    if (typeof body.currentPassword !== "string" || typeof body.newPassword !== "string") {
      return Response.json({ message: "Заполните оба поля пароля." }, { status: 400 });
    }

    await changeAdminPassword(body.currentPassword, body.newPassword);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof PasswordChangeError) {
      return Response.json({ message: error.message }, { status: 400 });
    }
    return Response.json({ message: "Не удалось сменить пароль." }, { status: 500 });
  }
}
