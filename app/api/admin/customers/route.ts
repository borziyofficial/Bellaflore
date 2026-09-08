import { getAdminCustomerOrders, listAdminCustomers } from "@/lib/adminOperationsDb";
import { isAdminRequestAuthorized, unauthorizedAdminResponse } from "@/lib/adminApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) return unauthorizedAdminResponse();
  try {
    const url = new URL(request.url);
    const phone = url.searchParams.get("phone");
    if (phone) {
      return Response.json(
        { orders: await getAdminCustomerOrders(phone) },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    return Response.json(
      { customers: await listAdminCustomers(url.searchParams.get("search") ?? "") },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ message: "Не удалось загрузить клиентов." }, { status: 500 });
  }
}
