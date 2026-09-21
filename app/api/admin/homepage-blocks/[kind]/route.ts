// ==================================================
// SECTION: Admin API — Homepage content block (single kind)
// ==================================================
import {
  getHomepageBlock,
  updateHomepageBlock,
  type HomepageBlockUpdateInput,
} from "@/lib/homepageBlocksDb";
import { isHomepageBlockKind } from "@/lib/homepageBlocksTypes";
import {
  isAdminRequestAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/adminApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  const { kind } = await params;
  if (!isHomepageBlockKind(kind)) {
    return Response.json({ message: "Неизвестный блок." }, { status: 404 });
  }

  try {
    const block = await getHomepageBlock(kind);
    return Response.json(
      { block },
      { headers: { "Cache-Control": "no-store, must-revalidate" } },
    );
  } catch {
    return Response.json({ message: "Не удалось загрузить блок." }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  const { kind } = await params;
  if (!isHomepageBlockKind(kind)) {
    return Response.json({ message: "Неизвестный блок." }, { status: 404 });
  }

  try {
    const body = (await request.json()) as { block?: HomepageBlockUpdateInput };
    if (!body.block || typeof body.block !== "object") {
      return Response.json({ message: "Некорректные данные блока." }, { status: 400 });
    }

    const patch: HomepageBlockUpdateInput = {};
    if (typeof body.block.title === "string") patch.title = body.block.title.trim();
    if (typeof body.block.subtitle === "string") patch.subtitle = body.block.subtitle.trim();
    if (typeof body.block.buttonText === "string") patch.buttonText = body.block.buttonText.trim();
    if (typeof body.block.buttonLink === "string") patch.buttonLink = body.block.buttonLink.trim();
    if (typeof body.block.isEnabled === "boolean") patch.isEnabled = body.block.isEnabled;
    if (Array.isArray(body.block.cards)) patch.cards = body.block.cards;

    const block = await updateHomepageBlock(kind, patch);
    return Response.json({ block });
  } catch {
    return Response.json({ message: "Не удалось сохранить блок." }, { status: 500 });
  }
}
