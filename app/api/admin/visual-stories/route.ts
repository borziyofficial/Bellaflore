import {
  getVisualStoriesSettings,
  updateVisualStoriesSettings,
} from "@/lib/visualStoriesDb";
import type { VisualStory } from "@/lib/visualStoriesTypes";
import {
  isAdminRequestAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/adminApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const settings = await getVisualStoriesSettings();
    return Response.json(
      { settings },
      { headers: { "Cache-Control": "no-store, must-revalidate" } },
    );
  } catch {
    return Response.json(
      { message: "Не удалось загрузить фото-витрину." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = (await request.json()) as { stories?: VisualStory[] };
    if (!Array.isArray(body.stories)) {
      return Response.json(
        { message: "Некорректные данные фото-витрины." },
        { status: 400 },
      );
    }

    const settings = await updateVisualStoriesSettings(body.stories);
    return Response.json({ settings });
  } catch {
    return Response.json(
      { message: "Не удалось сохранить фото-витрину." },
      { status: 500 },
    );
  }
}
