import { listAdminNotifications, markAdminNotificationRead } from "@/lib/adminOperationsDb";
import { isAdminRequestAuthorized, unauthorizedAdminResponse } from "@/lib/adminApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) return unauthorizedAdminResponse();
  try {
    const notifications = await listAdminNotifications();
    return Response.json(
      { notifications, unreadCount: notifications.filter((item) => !item.read).length },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ message: "Не удалось загрузить уведомления." }, { status: 500 });
  }
}
export async function POST(request: Request) {
  if (!isAdminRequestAuthorized(request)) return unauthorizedAdminResponse();
  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  if (typeof body?.id !== "string" || !body.id.trim()) {
    return Response.json({ message: "Уведомление не указано." }, { status: 400 });
  }
  try {
    await markAdminNotificationRead(body.id);
    return Response.json({ read: true });
  } catch {
    return Response.json({ message: "Не удалось отметить уведомление." }, { status: 500 });
  }
}
