export const runtime = "nodejs";

export async function POST() {
  return Response.json({
    id: `draft_${Date.now()}`,
    status: "active",
    items: [],
    conversationState: { turns: [] },
  });
}

export async function GET() {
  return Response.json({ drafts: [] });
}

export async function DELETE() {
  return Response.json({ success: true });
}
