// ==================================================
// SECTION: Order Draft API
// РАЗДЕЛ: API черновиков заказов
//
// Purpose (EN):
// REST API for creating, reading, and managing order drafts from AI consultation.
// Drafts persist conversation state, collected customer data, and product selections.
//
// Назначение (RU):
// REST API для создания, чтения и управления черновиками заказов из AI-консультации.
// Черновики сохраняют состояние разговора, собранные данные и выбранные товары.
// ==================================================
import { PostgresOrderDraftRepository } from "@/lib/orders/draftRepository";
import type { OrderDraft, UpdateOrderDraftInput, OrderDraftConversationState } from "@/lib/orders/draftTypes";

const draftRepository = new PostgresOrderDraftRepository();

export const runtime = "nodejs";

/**
 * POST /api/order-drafts
 * Create a new order draft or get/update existing draft by phone.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: "create" | "load" | "update";
      draftId?: string;
      customerPhone?: string;
      updates?: UpdateOrderDraftInput;
    };

    const action = body.action ?? "create";

    if (action === "create") {
      // Create a new draft with initial conversation state
      const draft: Omit<OrderDraft, "id" | "createdAt" | "updatedAt"> = {
        customerPhone: body.customerPhone || undefined,
        conversationState: { turns: [] },
        items: [],
        status: "active",
      };

      const created = await draftRepository.create(draft);
      return Response.json(created, { headers: { "Cache-Control": "no-store" } });
    }

    if (action === "load") {
      if (!body.draftId) {
        return Response.json(
          { error: "draftId is required for load action" },
          { status: 400 },
        );
      }

      const draft = await draftRepository.findById(body.draftId);
      if (!draft) {
        return Response.json({ error: "Draft not found" }, { status: 404 });
      }

      return Response.json(draft, { headers: { "Cache-Control": "no-store" } });
    }

    if (action === "update") {
      if (!body.draftId || !body.updates) {
        return Response.json(
          { error: "draftId and updates are required for update action" },
          { status: 400 },
        );
      }

      const updated = await draftRepository.update(body.draftId, body.updates);
      if (!updated) {
        return Response.json({ error: "Draft not found" }, { status: 404 });
      }

      return Response.json(updated, { headers: { "Cache-Control": "no-store" } });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Draft API error:", error);
    return Response.json(
      { error: "Не удалось обработать запрос черновика" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/order-drafts?phone=<phone>
 * Retrieve draft(s) by customer phone.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const phone = url.searchParams.get("phone")?.trim();
    const draftId = url.searchParams.get("id")?.trim();

    if (draftId) {
      const draft = await draftRepository.findById(draftId);
      if (!draft) {
        return Response.json({ error: "Draft not found" }, { status: 404 });
      }
      return Response.json(draft, { headers: { "Cache-Control": "no-store" } });
    }

    if (!phone) {
      return Response.json(
        { error: "phone or id parameter is required" },
        { status: 400 },
      );
    }

    const drafts = await draftRepository.findByCustomerPhone(phone, 10);
    return Response.json({ drafts }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Draft API error:", error);
    return Response.json(
      { error: "Не удалось получить черновик" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/order-drafts?id=<draftId>
 * Delete a draft.
 */
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const draftId = url.searchParams.get("id")?.trim();

    if (!draftId) {
      return Response.json({ error: "id parameter is required" }, { status: 400 });
    }

    const deleted = await draftRepository.delete(draftId);
    if (!deleted) {
      return Response.json({ error: "Draft not found" }, { status: 404 });
    }

    return Response.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Draft API error:", error);
    return Response.json(
      { error: "Не удалось удалить черновик" },
      { status: 500 },
    );
  }
}
