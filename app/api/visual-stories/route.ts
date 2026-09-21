import { getVisualStoriesSettings } from "@/lib/visualStoriesDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getVisualStoriesSettings();
    return Response.json(
      { settings },
      { headers: { "Cache-Control": "no-store, must-revalidate" } },
    );
  } catch {
    return Response.json(
      { message: "Не удалось загрузить витрину." },
      { status: 500 },
    );
  }
}
