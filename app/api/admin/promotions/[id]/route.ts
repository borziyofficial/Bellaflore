import { parsePromotionInput } from "@/app/api/admin/promotions/route";
import { deleteAdminPromotion, updateAdminPromotion } from "@/lib/adminOperationsDb";
import { isAdminRequestAuthorized, unauthorizedAdminResponse } from "@/lib/adminApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PromotionRouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: PromotionRouteContext) {
  if (!isAdminRequestAuthorized(request)) return unauthorizedAdminResponse();
  const input = parsePromotionInput(await request.json().catch(() => null));
  if (!input) {
    return Response.json({ message: "Проверьте название, скидку и даты акции." }, { status: 400 });
  }
  try {
    const { id } = await context.params;
    const promotion = await updateAdminPromotion(decodeURIComponent(id), input);
    return promotion
      ? Response.json({ promotion })
      : Response.json({ message: "Акция не найдена." }, { status: 404 });
  } catch {
    return Response.json({ message: "Не удалось обновить акцию." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: PromotionRouteContext) {
  if (!isAdminRequestAuthorized(request)) return unauthorizedAdminResponse();
  try {
    const { id } = await context.params;
    return (await deleteAdminPromotion(decodeURIComponent(id)))
      ? Response.json({ deleted: true })
      : Response.json({ message: "Акция не найдена." }, { status: 404 });
  } catch {
    return Response.json({ message: "Не удалось удалить акцию." }, { status: 500 });
  }
}
