// ==================================================
// SECTION: WORKFLOW INTELLIGENCE
// РАЗДЕЛ: Failure handling
// ==================================================
import type {
  Workflow,
  WorkflowFailureCode,
  WorkflowStep,
  WorkflowStepId,
} from "@/components/workflowIntelligence/workflowIntelligenceTypes";

export type WorkflowFailureRecovery = {
  failureCode: WorkflowFailureCode;
  title: string;
  canRetry: boolean;
  canSkip: boolean;
  requiresManualReview: boolean;
  suggestedAction: string;
};

const FAILURE_RECOVERY: Record<WorkflowFailureCode, WorkflowFailureRecovery> = {
  inventory_not_available: {
    failureCode: "inventory_not_available",
    title: "Недостаточно склада",
    canRetry: true,
    canSkip: false,
    requiresManualReview: true,
    suggestedAction: "Проверить замену цветов или отложить заказ",
  },
  courier_not_found: {
    failureCode: "courier_not_found",
    title: "Курьер не найден",
    canRetry: true,
    canSkip: true,
    requiresManualReview: false,
    suggestedAction: "Назначить курьера вручную или повторить подбор",
  },
  delivery_window_unavailable: {
    failureCode: "delivery_window_unavailable",
    title: "Интервал недоступен",
    canRetry: true,
    canSkip: false,
    requiresManualReview: true,
    suggestedAction: "Предложить клиенту другой интервал",
  },
  notification_failed: {
    failureCode: "notification_failed",
    title: "Ошибка уведомления",
    canRetry: true,
    canSkip: true,
    requiresManualReview: false,
    suggestedAction: "Повторить отправку или использовать in_app",
  },
  payment_attention: {
    failureCode: "payment_attention",
    title: "Требует внимания оплаты",
    canRetry: false,
    canSkip: false,
    requiresManualReview: true,
    suggestedAction: "Проверить оплату перед подтверждением",
  },
  order_cancelled: {
    failureCode: "order_cancelled",
    title: "Заказ отменён",
    canRetry: false,
    canSkip: false,
    requiresManualReview: false,
    suggestedAction: "Закрыть workflow",
  },
  unknown: {
    failureCode: "unknown",
    title: "Неизвестная ошибка",
    canRetry: true,
    canSkip: false,
    requiresManualReview: true,
    suggestedAction: "Отправить на ручную проверку",
  },
};

export function resolveWorkflowFailureRecovery(
  failureCode: WorkflowFailureCode | null,
): WorkflowFailureRecovery {
  if (!failureCode) {
    return FAILURE_RECOVERY.unknown;
  }

  return FAILURE_RECOVERY[failureCode] ?? FAILURE_RECOVERY.unknown;
}

export function detectWorkflowFailure(
  workflow: Workflow,
  step: WorkflowStep,
): WorkflowFailureRecovery | null {
  if (step.status !== "failed" || !step.failureCode) {
    return null;
  }

  return resolveWorkflowFailureRecovery(step.failureCode);
}

export function shouldPauseWorkflowOnFailure(
  failureCode: WorkflowFailureCode,
): boolean {
  return (
    failureCode === "payment_attention" ||
    failureCode === "inventory_not_available" ||
    failureCode === "delivery_window_unavailable"
  );
}

export function getExampleWorkflowFailure(): {
  stepId: WorkflowStepId;
  failureCode: WorkflowFailureCode;
  recovery: WorkflowFailureRecovery;
} {
  const failureCode: WorkflowFailureCode = "inventory_not_available";
  return {
    stepId: "inventory_check",
    failureCode,
    recovery: resolveWorkflowFailureRecovery(failureCode),
  };
}
