// ==================================================
// SECTION: WORKFLOW INTELLIGENCE
// РАЗДЕЛ: Courier bridge
// ==================================================
import { suggestCourierForOrderIntelligence } from "@/components/courierIntelligence/courierIntelligenceBridge";
import type {
  WorkflowContext,
  WorkflowResult,
  WorkflowStepId,
} from "@/components/workflowIntelligence/workflowIntelligenceTypes";

export function executeCourierWorkflowStep(
  stepId: WorkflowStepId,
  context: WorkflowContext,
): WorkflowResult {
  switch (stepId) {
    case "courier_suggestion": {
      const suggestion = suggestCourierForOrderIntelligence(context.orderId);

      if (!suggestion?.recommendedCourier) {
        return {
          ok: false,
          stepId,
          output: { candidates: suggestion?.candidates ?? [] },
          failureCode: "courier_not_found",
          message: "No suitable courier found",
          nextStepId: null,
        };
      }

      return {
        ok: true,
        stepId,
        output: {
          recommendedCourierId: suggestion.recommendedCourier.courier.id,
          recommendedCourierName: suggestion.recommendedCourier.courier.fullName,
          score: suggestion.recommendedCourier.score,
          reasons: suggestion.recommendedCourier.reasons,
        },
        failureCode: null,
        message: "Courier suggestion prepared",
        nextStepId: "notification_admin_new_order",
      };
    }
    case "courier_assigned":
      return {
        ok: true,
        stepId,
        output: {
          assignCommand: {
            orderId: context.orderId,
            source: "workflow_intelligence",
          },
        },
        failureCode: null,
        message: "Courier assignment command prepared",
        nextStepId: "delivery_started",
      };
    default:
      return {
        ok: true,
        stepId,
        output: null,
        failureCode: null,
        message: "Courier bridge: no-op",
        nextStepId: null,
      };
  }
}
