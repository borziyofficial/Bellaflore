import { getAdminAnalytics } from "@/lib/adminOperationsDb";
import { isAdminRequestAuthorized, unauthorizedAdminResponse } from "@/lib/adminApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) return unauthorizedAdminResponse();
  try {
    const value = Number(new URL(request.url).searchParams.get("days"));
    const days = value === 1 || value === 7 || value === 30 ? value : 7;
    return Response.json(
      { analytics: await getAdminAnalytics(days) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ message: "Не удалось загрузить аналитику." }, { status: 500 });
  }
}
