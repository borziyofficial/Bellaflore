// ==================================================
// SECTION: PROMOTION INTELLIGENCE
// РАЗДЕЛ: Rules engine
// ==================================================
import type {
  PromotionRule,
  PromotionRuleEvaluationContext,
  PromotionRuleEvaluationResult,
} from "@/components/promotionIntelligence/promotionTypes";

function compareNumeric(
  actual: number | undefined,
  operator: PromotionRule["operator"],
  expected: number | string | boolean | string[],
): boolean {
  if (actual === undefined) {
    return false;
  }

  if (operator === "eq") {
    return actual === Number(expected);
  }

  if (operator === "gte") {
    return actual >= Number(expected);
  }

  if (operator === "lte") {
    return actual <= Number(expected);
  }

  if (operator === "between" && Array.isArray(expected) && expected.length === 2) {
    const min = Number(expected[0]);
    const max = Number(expected[1]);
    return actual >= min && actual <= max;
  }

  return false;
}

function compareString(
  actual: string | undefined,
  operator: PromotionRule["operator"],
  expected: string | number | boolean | string[],
): boolean {
  if (actual === undefined) {
    return false;
  }

  if (operator === "eq") {
    return actual === String(expected);
  }

  if (operator === "in" && Array.isArray(expected)) {
    return expected.includes(actual);
  }

  return false;
}

export function evaluatePromotionRule(
  rule: PromotionRule,
  context: PromotionRuleEvaluationContext,
): PromotionRuleEvaluationResult {
  let passed = false;
  let reason = rule.label;

  switch (rule.condition) {
    case "min_order_rub":
    case "max_order_rub": {
      const value =
        rule.condition === "min_order_rub"
          ? context.orderTotalRub
          : context.orderTotalRub;
      passed = compareNumeric(value, rule.operator, rule.value);
      reason = passed
        ? `${rule.label}: выполнено`
        : `${rule.label}: не выполнено (${value ?? 0} ₽)`;
      break;
    }
    case "vip_level":
      passed = compareNumeric(context.vipLevel, rule.operator, rule.value);
      reason = passed
        ? `${rule.label}: выполнено`
        : `${rule.label}: VIP ${context.vipLevel ?? 0}`;
      break;
    case "customer_segment":
      passed = compareString(context.customerSegment, rule.operator, rule.value);
      reason = passed
        ? `${rule.label}: сегмент ${context.customerSegment}`
        : `${rule.label}: сегмент не подходит`;
      break;
    case "birthday_month":
      passed =
        context.birthdayMonth !== undefined &&
        compareNumeric(context.birthdayMonth, rule.operator, rule.value);
      reason = passed
        ? `${rule.label}: месяц совпадает`
        : `${rule.label}: не в месяце дня рождения`;
      break;
    case "order_count":
      passed = compareNumeric(context.orderCount, rule.operator, rule.value);
      reason = passed
        ? `${rule.label}: заказов ${context.orderCount}`
        : `${rule.label}: недостаточно заказов`;
      break;
    case "day_of_week":
      passed = compareNumeric(context.dayOfWeek, rule.operator, rule.value);
      reason = passed ? `${rule.label}: день недели подходит` : `${rule.label}: день не подходит`;
      break;
    case "hour_range":
      passed = compareNumeric(context.hour, rule.operator, rule.value);
      reason = passed ? `${rule.label}: время подходит` : `${rule.label}: вне временного окна`;
      break;
    case "season":
      passed = compareString(context.season, rule.operator, rule.value);
      reason = passed ? `${rule.label}: сезон ${context.season}` : `${rule.label}: сезон не подходит`;
      break;
    case "product_in_cart": {
      const productIds = context.productIdsInCart ?? [];
      passed =
        rule.operator === "in" && Array.isArray(rule.value)
          ? rule.value.some((id) => productIds.includes(id))
          : productIds.includes(String(rule.value));
      reason = passed ? `${rule.label}: товар в корзине` : `${rule.label}: товар не найден`;
      break;
    }
    case "category_in_cart": {
      const categoryIds = context.categoryIdsInCart ?? [];
      passed =
        rule.operator === "in" && Array.isArray(rule.value)
          ? rule.value.some((id) => categoryIds.includes(id))
          : categoryIds.includes(String(rule.value));
      reason = passed ? `${rule.label}: категория в корзине` : `${rule.label}: категория не найдена`;
      break;
    }
    case "first_order":
      passed = context.isFirstOrder === Boolean(rule.value);
      reason = passed ? `${rule.label}: первый заказ` : `${rule.label}: не первый заказ`;
      break;
    case "loyalty_points":
      passed = compareNumeric(context.loyaltyPoints, rule.operator, rule.value);
      reason = passed
        ? `${rule.label}: баллов ${context.loyaltyPoints}`
        : `${rule.label}: недостаточно баллов`;
      break;
    default:
      passed = false;
      reason = `Неизвестное условие: ${rule.condition}`;
  }

  return { ruleId: rule.id, passed, reason };
}

export function evaluatePromotionRules(
  rules: PromotionRule[],
  context: PromotionRuleEvaluationContext,
): PromotionRuleEvaluationResult[] {
  return [...rules]
    .sort((left, right) => right.priority - left.priority)
    .map((rule) => evaluatePromotionRule(rule, context));
}

export function allPromotionRulesPassed(
  rules: PromotionRule[],
  context: PromotionRuleEvaluationContext,
): boolean {
  if (rules.length === 0) {
    return true;
  }

  return evaluatePromotionRules(rules, context).every((result) => result.passed);
}

export const PROMOTION_RULE_CONDITIONS = [
  "min_order_rub",
  "max_order_rub",
  "vip_level",
  "customer_segment",
  "birthday_month",
  "order_count",
  "day_of_week",
  "hour_range",
  "season",
  "product_in_cart",
  "category_in_cart",
  "first_order",
  "loyalty_points",
] as const;

export const PROMOTION_KINDS = [
  "promo_code",
  "coupon",
  "gift_card",
  "loyalty",
  "vip_discount",
  "birthday_discount",
  "free_delivery",
  "flash_sale",
  "happy_hour",
  "seasonal",
  "featured_products",
  "banner",
  "campaign",
] as const;
