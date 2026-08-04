import { PostgresOrderCatalogGateway } from "@/lib/orders/catalogGateway";
import { createOrdersLookupGetHandler } from "@/lib/orders/http";
import { PostgresOrderRepository } from "@/lib/orders/repository";
import { createOrderService } from "@/lib/orders/service";

export const runtime = "nodejs";

const service = createOrderService({
  catalog: new PostgresOrderCatalogGateway(),
  repository: new PostgresOrderRepository(),
});

export const GET = createOrdersLookupGetHandler({ service });
