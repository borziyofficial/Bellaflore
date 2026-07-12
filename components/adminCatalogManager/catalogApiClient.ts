// ==================================================
// SECTION: Admin Catalog Manager — server API client
// РАЗДЕЛ: Клиент серверного API каталога
// ==================================================
import type { AdminProductFormState } from "@/components/adminCatalogManager/adminCatalogTypes";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";

type CatalogApiListResponse = {
  products: CatalogProductRecord[];
  mode?: string;
  imageStorageWarning?: string | null;
  message?: string;
  configured?: boolean;
};

type CatalogApiProductResponse = {
  product: CatalogProductRecord;
  message?: string;
};

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function catalogRequest<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.headers ?? {}),
    },
  });

  const body = await parseJson<T & { message?: string }>(response);
  if (!response.ok) {
    throw new Error(body.message || "Ошибка API каталога.");
  }

  return body;
}

export async function fetchAdminCatalogProducts(): Promise<CatalogApiListResponse> {
  return catalogRequest<CatalogApiListResponse>("/api/admin/products");
}

export async function saveAdminCatalogProduct(
  form: AdminProductFormState,
): Promise<CatalogProductRecord> {
  const endpoint = form.id
    ? `/api/admin/products/${encodeURIComponent(form.id)}`
    : "/api/admin/products";
  const method = form.id ? "PUT" : "POST";
  const body = await catalogRequest<CatalogApiProductResponse>(endpoint, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ form }),
  });
  return body.product;
}

export async function publishAdminCatalogProduct(
  productId: string,
): Promise<CatalogProductRecord> {
  const body = await catalogRequest<CatalogApiProductResponse>(
    `/api/admin/products/${encodeURIComponent(productId)}/publish`,
    { method: "POST" },
  );
  return body.product;
}

export async function unpublishAdminCatalogProduct(
  productId: string,
): Promise<CatalogProductRecord> {
  const body = await catalogRequest<CatalogApiProductResponse>(
    `/api/admin/products/${encodeURIComponent(productId)}/unpublish`,
    { method: "POST" },
  );
  return body.product;
}

export async function archiveAdminCatalogProduct(
  productId: string,
): Promise<CatalogProductRecord> {
  const body = await catalogRequest<CatalogApiProductResponse>(
    `/api/admin/products/${encodeURIComponent(productId)}/archive`,
    { method: "POST" },
  );
  return body.product;
}

export async function deleteAdminCatalogProduct(
  productId: string,
): Promise<CatalogProductRecord> {
  const body = await catalogRequest<CatalogApiProductResponse>(
    `/api/admin/products/${encodeURIComponent(productId)}`,
    { method: "DELETE" },
  );
  return body.product;
}

export async function fetchPublishedStorefrontProducts(): Promise<
  import("@/data/catalogProducts").CatalogProduct[]
> {
  const response = await fetch("/api/catalog/products?published=1", {
    cache: "no-store",
  });
  const body = (await response.json()) as {
    products?: import("@/data/catalogProducts").CatalogProduct[];
    message?: string;
  };

  if (!response.ok) {
    return [];
  }

  return body.products ?? [];
}

export async function fetchImageStorageWarning(): Promise<string | null> {
  try {
    const body = await fetchAdminCatalogProducts();
    return body.imageStorageWarning ?? null;
  } catch {
    return null;
  }
}
