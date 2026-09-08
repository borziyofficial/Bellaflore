import {
  createAdminPromotion,
  listAdminPromotions,
  type AdminPromotionInput,
} from "@/lib/adminOperationsDb";
import { isAdminRequestAuthorized, unauthorizedAdminResponse } from "@/lib/adminApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePromotionInput(value: unknown): AdminPromotionInput | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const discountType = body.discountType === "percent" ? "percent" : body.discountType === "fixed" ? "fixed" : null;
  const discountValue = Number(body.discountValue);
  const startsAt = typeof body.startsAt === "string" ? body.startsAt : "";
  const endsAt = typeof body.endsAt === "string" ? body.endsAt : "";
  if (
    !title ||
    !discountType ||
    !Number.isFinite(discountValue) ||
    discountValue <= 0 ||
    (discountType === "percent" && discountValue > 100) ||
    !startsAt ||
    !endsAt ||
    Number.isNaN(Date.parse(startsAt)) ||
    Number.isNaN(Date.parse(endsAt)) ||
    Date.parse(endsAt) < Date.parse(startsAt)
  ) {
    return null;
  }
  return {
    title,
    description,
    discountType,
    discountValue,
    startsAt,
    endsAt,
    isActive: body.isActive === true,
  };
}

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) return unauthorizedAdminResponse();
  try {
    return Response.json(
      { promotions: await listAdminPromotions(), integration: "pending" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ message: "Не удалось загрузить акции." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequestAuthorized(request)) return unauthorizedAdminResponse();
  const input = parsePromotionInput(await request.json().catch(() => null));
  if (!input) {
    return Response.json({ message: "Проверьте название, скидку и даты акции." }, { status: 400 });
  }
  try {
    return Response.json({ promotion: await createAdminPromotion(input) }, { status: 201 });
  } catch {
    return Response.json({ message: "Не удалось создать акцию." }, { status: 500 });
  }
}

export { parsePromotionInput };
