import {
  createAdminOrderDetailGetHandler,
  createAdminOrderStatusPatchHandler,
} from "@/lib/orders/adminHttp";
import { PostgresOrderRepository } from "@/lib/orders/repository";
import { isAdminRequestAuthorized } from "@/lib/adminApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const repository = new PostgresOrderRepository();

export const GET = createAdminOrderDetailGetHandler({
  repository,
  authorize: isAdminRequestAuthorized,
});

export const PATCH = createAdminOrderStatusPatchHandler({
  repository,
  authorize: isAdminRequestAuthorized,
});
