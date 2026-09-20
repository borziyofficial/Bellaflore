import { redirect } from "next/navigation";

type CatalogRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CatalogRoute({ searchParams }: CatalogRouteProps) {
  const incoming = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(incoming)) {
    if (Array.isArray(value)) {
      for (const item of value) query.append(key, item);
    } else if (typeof value === "string") {
      query.set(key, value);
    }
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  redirect(`/${suffix}#catalog`);
}
