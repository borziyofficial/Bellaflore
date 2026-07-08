import type { BouquetDraft } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import {
  bouquetDraftToStored,
  storedBouquetsToRecords,
} from "@/lib/bouquetDb/mappers";
import { normalizeStoredBouquetRecords } from "@/lib/bouquetDb/normalize";
import {
  BouquetDatabaseNotConfiguredError,
  getBouquetDatabaseMode,
  listBouquets,
  replaceBouquets,
  upsertBouquet,
} from "@/lib/bouquetDb";
import {
  isAdminRequestAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/adminApiAuth";

export const runtime = "nodejs";

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

  return Response.json({ message: "Не удалось обработать букеты." }, { status: 500 });
}

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const bouquets = await listBouquets();
    return Response.json({
      bouquets,
      mode: getBouquetDatabaseMode(),
    });
  } catch (error) {
    return bouquetUnavailableResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = (await request.json()) as {
      draft?: BouquetDraft;
      id?: string;
      existing?: ReturnType<typeof listBouquets> extends Promise<infer T> ? T : never;
    };

    if (!body.draft) {
      return Response.json({ message: "Некорректные данные букета." }, { status: 400 });
    }

    const existing = storedBouquetsToRecords(await listBouquets());
    const stored = bouquetDraftToStored(body.draft, existing, body.id);
    const saved = await upsertBouquet(stored);

    return Response.json({
      bouquet: saved,
      mode: getBouquetDatabaseMode(),
    });
  } catch (error) {
    return bouquetUnavailableResponse(error);
  }
}

export async function PUT(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = (await request.json()) as { bouquets?: unknown[] };
    if (!Array.isArray(body.bouquets)) {
      return Response.json({ message: "Некорректный список букетов." }, { status: 400 });
    }

    const normalized = normalizeStoredBouquetRecords(body.bouquets);
    const saved = await replaceBouquets(normalized);

    return Response.json({
      bouquets: saved,
      mode: getBouquetDatabaseMode(),
    });
  } catch (error) {
    return bouquetUnavailableResponse(error);
  }
}
