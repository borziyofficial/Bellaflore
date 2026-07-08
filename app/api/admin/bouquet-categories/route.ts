import { normalizeStoredCategoryStorage } from "@/lib/bouquetDb/normalize";
import {
  BouquetDatabaseNotConfiguredError,
  getBouquetDatabaseMode,
  readCategoryStorage,
  writeCategoryStorage,
} from "@/lib/bouquetDb";
import {
  isAdminRequestAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/adminApiAuth";

export const runtime = "nodejs";

function categoryUnavailableResponse(error: unknown): Response {
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

  return Response.json({ message: "Не удалось обработать категории." }, { status: 500 });
}

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const storage = await readCategoryStorage();
    return Response.json({
      storage,
      mode: getBouquetDatabaseMode(),
    });
  } catch (error) {
    return categoryUnavailableResponse(error);
  }
}

export async function PUT(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = (await request.json()) as { storage?: unknown };
    const storage = normalizeStoredCategoryStorage(body.storage);
    const saved = await writeCategoryStorage(storage);

    return Response.json({
      storage: saved,
      mode: getBouquetDatabaseMode(),
    });
  } catch (error) {
    return categoryUnavailableResponse(error);
  }
}
