// ==================================================
// SECTION: WORKFLOW INTELLIGENCE
// РАЗДЕЛ: new_order_workflow definition
// ==================================================
import type {
  NewOrderWorkflowStepId,
  WorkflowStep,
} from "@/components/workflowIntelligence/workflowIntelligenceTypes";

export const NEW_ORDER_WORKFLOW_TYPE = "new_order_workflow";

export const NEW_ORDER_WORKFLOW_STEPS: Array<
  Pick<WorkflowStep, "id" | "title" | "optional" | "dependsOn">
> = [
  { id: "order_created", title: "Заказ создан", optional: false, dependsOn: [] },
  {
    id: "inventory_check",
    title: "Проверка склада",
    optional: false,
    dependsOn: ["order_created"],
  },
  {
    id: "inventory_reservation",
    title: "Резервирование склада",
    optional: false,
    dependsOn: ["inventory_check"],
  },
  {
    id: "delivery_task_created",
    title: "Создание задачи доставки",
    optional: false,
    dependsOn: ["inventory_reservation"],
  },
  {
    id: "courier_suggestion",
    title: "Подбор курьера",
    optional: true,
    dependsOn: ["delivery_task_created"],
  },
  {
    id: "notification_admin_new_order",
    title: "Уведомление администратора",
    optional: false,
    dependsOn: ["delivery_task_created"],
  },
  {
    id: "wait_admin_confirmation",
    title: "Ожидание подтверждения",
    optional: false,
    dependsOn: ["notification_admin_new_order"],
  },
  {
    id: "order_confirmed",
    title: "Заказ подтверждён",
    optional: false,
    dependsOn: ["wait_admin_confirmation"],
  },
  {
    id: "courier_assigned",
    title: "Курьер назначен",
    optional: false,
    dependsOn: ["order_confirmed"],
  },
  {
    id: "delivery_started",
    title: "Доставка начата",
    optional: false,
    dependsOn: ["courier_assigned"],
  },
  {
    id: "delivery_completed",
    title: "Доставка завершена",
    optional: false,
    dependsOn: ["delivery_started"],
  },
  {
    id: "inventory_confirm_usage",
    title: "Списание со склада",
    optional: false,
    dependsOn: ["delivery_completed"],
  },
  {
    id: "order_closed",
    title: "Заказ закрыт",
    optional: false,
    dependsOn: ["inventory_confirm_usage"],
  },
];

export function buildNewOrderWorkflowSteps(): WorkflowStep[] {
  return NEW_ORDER_WORKFLOW_STEPS.map((step) => ({
    ...step,
    status: "pending",
    startedAt: null,
    completedAt: null,
    failedReason: null,
    failureCode: null,
    retryCount: 0,
    output: null,
  }));
}

export function getNewOrderWorkflowStepOrder(): NewOrderWorkflowStepId[] {
  return NEW_ORDER_WORKFLOW_STEPS.map((step) => step.id as NewOrderWorkflowStepId);
}
