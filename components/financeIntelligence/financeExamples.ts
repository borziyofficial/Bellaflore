// ==================================================
// SECTION: FINANCE INTELLIGENCE
// РАЗДЕЛ: Seed examples
// ==================================================
import type {
  CashFlowEntry,
  CourierCostEntry,
  DailyRevenueMetric,
  ExpenseEntry,
  FinanceAiPreparation,
  FinancialForecast,
  MarginAnalyticsEntry,
  MonthlyRevenueMetric,
  OperationalExpenseSummary,
  RefundEntry,
  RevenueEntry,
  SupplierCostEntry,
} from "@/components/financeIntelligence/financeTypes";

const NOW = new Date().toISOString();

export const FINANCE_EXAMPLE_REVENUE: RevenueEntry[] = [
  {
    id: "revenue-order-001",
    kind: "order",
    orderId: "order-20260620-001",
    title: "Букет «Розовый рассвет»",
    amountRub: 8500,
    occurredAt: "2026-06-20T14:30:00.000Z",
    recordedAt: NOW,
  },
  {
    id: "revenue-order-002",
    kind: "order",
    orderId: "order-20260621-002",
    title: "Букет «Пионовая мечта»",
    amountRub: 12500,
    occurredAt: "2026-06-21T11:00:00.000Z",
    recordedAt: NOW,
  },
  {
    id: "revenue-delivery-001",
    kind: "delivery_fee",
    orderId: "order-20260620-001",
    title: "Доставка до 7 км",
    amountRub: 350,
    occurredAt: "2026-06-20T14:30:00.000Z",
    recordedAt: NOW,
  },
  {
    id: "revenue-order-003",
    kind: "order",
    orderId: "order-20260622-003",
    title: "Композиция «Весенний сад»",
    amountRub: 6200,
    occurredAt: "2026-06-22T16:45:00.000Z",
    recordedAt: NOW,
  },
  {
    id: "revenue-gift-001",
    kind: "gift_card",
    orderId: null,
    title: "Подарочная карта 5000 ₽",
    amountRub: 5000,
    occurredAt: "2026-06-23T10:00:00.000Z",
    recordedAt: NOW,
  },
];

export const FINANCE_EXAMPLE_EXPENSES: ExpenseEntry[] = [
  {
    id: "expense-supplier-001",
    kind: "supplier",
    supplierId: "supplier-flora-moscow",
    courierId: null,
    title: "Закупка роз — Flora Moscow",
    amountRub: 42500,
    occurredAt: "2026-06-18T09:00:00.000Z",
    recordedAt: NOW,
  },
  {
    id: "expense-supplier-002",
    kind: "supplier",
    supplierId: "supplier-bloom-trade",
    courierId: null,
    title: "Закупка тюльпанов — Bloom Trade",
    amountRub: 18000,
    occurredAt: "2026-06-19T10:00:00.000Z",
    recordedAt: NOW,
  },
  {
    id: "expense-courier-001",
    kind: "courier",
    supplierId: null,
    courierId: "courier-ivan",
    title: "Оплата доставок — Иван",
    amountRub: 4200,
    occurredAt: "2026-06-20T20:00:00.000Z",
    recordedAt: NOW,
  },
  {
    id: "expense-courier-002",
    kind: "courier",
    supplierId: null,
    courierId: "courier-maria",
    title: "Оплата доставок — Мария",
    amountRub: 3800,
    occurredAt: "2026-06-21T20:00:00.000Z",
    recordedAt: NOW,
  },
  {
    id: "expense-operational-001",
    kind: "operational",
    supplierId: null,
    courierId: null,
    title: "Аренда холодильной камеры",
    amountRub: 15000,
    occurredAt: "2026-06-01T00:00:00.000Z",
    recordedAt: NOW,
  },
  {
    id: "expense-marketing-001",
    kind: "marketing",
    supplierId: null,
    courierId: null,
    title: "Реклама в соцсетях — июнь",
    amountRub: 8000,
    occurredAt: "2026-06-05T00:00:00.000Z",
    recordedAt: NOW,
  },
];

export const FINANCE_EXAMPLE_REFUNDS: RefundEntry[] = [
  {
    id: "refund-001",
    orderId: "order-20260615-004",
    amountRub: 7200,
    reason: "Клиент отменил заказ до сборки",
    status: "completed",
    occurredAt: "2026-06-15T18:00:00.000Z",
    recordedAt: NOW,
  },
  {
    id: "refund-002",
    orderId: "order-20260618-005",
    amountRub: 3500,
    reason: "Частичный возврат — повреждённая упаковка",
    status: "completed",
    occurredAt: "2026-06-18T12:00:00.000Z",
    recordedAt: NOW,
  },
  {
    id: "refund-003",
    orderId: "order-20260624-006",
    amountRub: 9800,
    reason: "Запрос на возврат — несоответствие букета",
    status: "pending",
    occurredAt: "2026-06-24T09:00:00.000Z",
    recordedAt: NOW,
  },
];

export const FINANCE_EXAMPLE_CASH_FLOW: CashFlowEntry[] = [
  {
    id: "cf-in-001",
    direction: "inflow",
    title: "Оплата заказа order-20260620-001",
    amountRub: 8850,
    sourceKind: "order",
    sourceId: "revenue-order-001",
    occurredAt: "2026-06-20T14:30:00.000Z",
  },
  {
    id: "cf-in-002",
    direction: "inflow",
    title: "Оплата заказа order-20260621-002",
    amountRub: 12500,
    sourceKind: "order",
    sourceId: "revenue-order-002",
    occurredAt: "2026-06-21T11:00:00.000Z",
  },
  {
    id: "cf-out-001",
    direction: "outflow",
    title: "Закупка роз — Flora Moscow",
    amountRub: 42500,
    sourceKind: "supplier",
    sourceId: "expense-supplier-001",
    occurredAt: "2026-06-18T09:00:00.000Z",
  },
  {
    id: "cf-out-002",
    direction: "outflow",
    title: "Оплата доставок — Иван",
    amountRub: 4200,
    sourceKind: "courier",
    sourceId: "expense-courier-001",
    occurredAt: "2026-06-20T20:00:00.000Z",
  },
];

export const FINANCE_EXAMPLE_DAILY_REVENUE: DailyRevenueMetric[] = [
  {
    date: "2026-06-20",
    totalRevenueRub: 8850,
    orderCount: 1,
    averageOrderRub: 8500,
    deliveryFeeRub: 350,
    refundRub: 0,
    netRevenueRub: 8850,
  },
  {
    date: "2026-06-21",
    totalRevenueRub: 12500,
    orderCount: 1,
    averageOrderRub: 12500,
    deliveryFeeRub: 0,
    refundRub: 0,
    netRevenueRub: 12500,
  },
  {
    date: "2026-06-22",
    totalRevenueRub: 6200,
    orderCount: 1,
    averageOrderRub: 6200,
    deliveryFeeRub: 0,
    refundRub: 0,
    netRevenueRub: 6200,
  },
  {
    date: "2026-06-23",
    totalRevenueRub: 5000,
    orderCount: 0,
    averageOrderRub: 0,
    deliveryFeeRub: 0,
    refundRub: 0,
    netRevenueRub: 5000,
  },
];

export const FINANCE_EXAMPLE_MONTHLY_REVENUE: MonthlyRevenueMetric[] = [
  {
    month: "2026-04",
    totalRevenueRub: 485000,
    orderCount: 62,
    averageOrderRub: 7823,
    deliveryFeeRub: 12400,
    refundRub: 15000,
    netRevenueRub: 470000,
  },
  {
    month: "2026-05",
    totalRevenueRub: 620000,
    orderCount: 78,
    averageOrderRub: 7949,
    deliveryFeeRub: 18600,
    refundRub: 22000,
    netRevenueRub: 598000,
  },
  {
    month: "2026-06",
    totalRevenueRub: 32550,
    orderCount: 3,
    averageOrderRub: 9067,
    deliveryFeeRub: 350,
    refundRub: 10700,
    netRevenueRub: 21850,
  },
];

export const FINANCE_EXAMPLE_MARGIN_ANALYTICS: MarginAnalyticsEntry[] = [
  {
    id: "margin-rose-bouquet",
    productSku: "bouquet-rose-sunset",
    productTitle: "Букет «Розовый рассвет»",
    revenueRub: 8500,
    costRub: 3200,
    marginRub: 5300,
    marginPercent: 62.4,
    periodLabel: "2026-06",
    calculatedAt: NOW,
  },
  {
    id: "margin-peony-bouquet",
    productSku: "bouquet-peony-dream",
    productTitle: "Букет «Пионовая мечта»",
    revenueRub: 12500,
    costRub: 5800,
    marginRub: 6700,
    marginPercent: 53.6,
    periodLabel: "2026-06",
    calculatedAt: NOW,
  },
  {
    id: "margin-spring-garden",
    productSku: "composition-spring-garden",
    productTitle: "Композиция «Весенний сад»",
    revenueRub: 6200,
    costRub: 2900,
    marginRub: 3300,
    marginPercent: 53.2,
    periodLabel: "2026-06",
    calculatedAt: NOW,
  },
];

export const FINANCE_EXAMPLE_COURIER_COSTS: CourierCostEntry[] = [
  {
    id: "courier-cost-ivan",
    courierId: "courier-ivan",
    courierName: "Иван",
    deliveryCount: 28,
    totalCostRub: 4200,
    averageCostRub: 150,
    periodLabel: "2026-06",
    calculatedAt: NOW,
  },
  {
    id: "courier-cost-maria",
    courierId: "courier-maria",
    courierName: "Мария",
    deliveryCount: 25,
    totalCostRub: 3800,
    averageCostRub: 152,
    periodLabel: "2026-06",
    calculatedAt: NOW,
  },
];

export const FINANCE_EXAMPLE_SUPPLIER_COSTS: SupplierCostEntry[] = [
  {
    id: "supplier-cost-flora",
    supplierId: "supplier-flora-moscow",
    supplierName: "Flora Moscow",
    purchaseCount: 12,
    totalCostRub: 425000,
    averageCostRub: 35417,
    periodLabel: "2026-06",
    calculatedAt: NOW,
  },
  {
    id: "supplier-cost-bloom",
    supplierId: "supplier-bloom-trade",
    supplierName: "Bloom Trade",
    purchaseCount: 5,
    totalCostRub: 180000,
    averageCostRub: 36000,
    periodLabel: "2026-06",
    calculatedAt: NOW,
  },
];

export const FINANCE_EXAMPLE_OPERATIONAL: OperationalExpenseSummary[] = [
  {
    id: "op-rent",
    category: "Аренда",
    totalRub: 15000,
    entryCount: 1,
    periodLabel: "2026-06",
    calculatedAt: NOW,
  },
  {
    id: "op-marketing",
    category: "Маркетинг",
    totalRub: 8000,
    entryCount: 1,
    periodLabel: "2026-06",
    calculatedAt: NOW,
  },
  {
    id: "op-utilities",
    category: "Коммунальные услуги",
    totalRub: 5500,
    entryCount: 1,
    periodLabel: "2026-06",
    calculatedAt: NOW,
  },
];

export const FINANCE_EXAMPLE_FORECASTS: FinancialForecast[] = [
  {
    id: "forecast-july-2026",
    periodLabel: "2026-07",
    projectedRevenueRub: 680000,
    projectedExpenseRub: 420000,
    projectedProfitRub: 260000,
    confidence: 0.72,
    assumptions: [
      "Сезонный рост спроса на летние букеты",
      "Стабильные цены поставщиков Flora Moscow",
    ],
    createdAt: NOW,
  },
  {
    id: "forecast-august-2026",
    periodLabel: "2026-08",
    projectedRevenueRub: 720000,
    projectedExpenseRub: 445000,
    projectedProfitRub: 275000,
    confidence: 0.65,
    assumptions: [
      "Пик свадебного сезона",
      "Возможный рост расходов на курьеров",
    ],
    createdAt: NOW,
  },
];

export const FINANCE_EXAMPLE_AI: FinanceAiPreparation[] = [
  {
    id: "ai-finance-margin-alert",
    title: "Margin drop on peony bouquets",
    rationale: "Пионовая мечта margin 53.6% — ниже среднего 58%. Рассмотреть корректировку цены или поставщика",
    suggestedAction: "review_pricing_or_supplier",
    projectedImpactRub: 1200,
    confidence: 0.78,
    status: "suggestion_only",
    createdAt: NOW,
  },
  {
    id: "ai-finance-cash-flow",
    title: "Cash flow optimization",
    rationale: "Supplier payments 42 500 ₽ 18 июня — рассмотреть отсрочку платежа по контракту Flora Moscow",
    suggestedAction: "negotiate_payment_terms",
    projectedImpactRub: 42500,
    confidence: 0.71,
    status: "suggestion_only",
    createdAt: NOW,
  },
];

export function buildFinanceExampleRegistryState() {
  return {
    revenue: [...FINANCE_EXAMPLE_REVENUE],
    expenses: [...FINANCE_EXAMPLE_EXPENSES],
    refunds: [...FINANCE_EXAMPLE_REFUNDS],
    cashFlow: [...FINANCE_EXAMPLE_CASH_FLOW],
    dailyRevenue: [...FINANCE_EXAMPLE_DAILY_REVENUE],
    monthlyRevenue: [...FINANCE_EXAMPLE_MONTHLY_REVENUE],
    marginAnalytics: [...FINANCE_EXAMPLE_MARGIN_ANALYTICS],
    courierCosts: [...FINANCE_EXAMPLE_COURIER_COSTS],
    supplierCosts: [...FINANCE_EXAMPLE_SUPPLIER_COSTS],
    operationalExpenses: [...FINANCE_EXAMPLE_OPERATIONAL],
    forecasts: [...FINANCE_EXAMPLE_FORECASTS],
    aiPreparations: [...FINANCE_EXAMPLE_AI],
  };
}
