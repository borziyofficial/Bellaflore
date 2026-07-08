import { storedBouquetsToRecords } from "@/lib/bouquetDb/mappers";
import {
  BouquetDatabaseNotConfiguredError,
  deleteBouquet,
  getBouquetById,
  getBouquetDatabaseMode,
} from "@/lib/bouquetDb";
import {
  isAdminRequestAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/adminApiAuth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function bouquetUnavailableResponse(error: unknown): Response {
  if (error instanceof BouquetDatabaseNotConfiguredError) {
    return Response.json(
      {
        message: error.message,
        configured: false,
        mode: getBouquetDatabaseMode(),
      },
      { status: 503 },
    );
  }

  return Response.json({ message: "Не удалось обработать букет." }, { status: 500 });
}

export async function GET(request: Request, context: RouteContext) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const { id } = await context.params;
    const bouquet = await getBouquetById(id);
    if (!bouquet) {
      return Response.json({ message: "Букет не найден." }, { status: 404 });
    }

    return Response.json({
      bouquet: storedBouquetsToRecords([bouquet])[0],
      mode: getBouquetDatabaseMode(),
    });
  } catch (error) {
    return bouquetUnavailableResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const { id } = await context.params;
    const deleted = await deleteBouquet(id);
    if (!deleted) {
      return Response.json({ message: "Букет не найден." }, { status: 404 });
    }

    return Response.json({
      ok: true,
      mode: getBouquetDatabaseMode(),
    });
  } catch (error) {
    return bouquetUnavailableResponse(error);
  }
}
