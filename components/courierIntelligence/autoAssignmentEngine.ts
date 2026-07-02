// ==================================================
// SECTION: COURIER INTELLIGENCE
// РАЗДЕЛ: Auto assignment engine
// ==================================================
import { mergeCourierProfilesWithAdmin } from "@/components/courierIntelligence/courierAdminStore";
import {
  rankCourierCandidates,
  scoreCourierForAssignment,
} from "@/components/courierIntelligence/courierScoringEngine";
import type {
  CourierAssignmentRequest,
  CourierAutoAssignmentResult,
} from "@/components/courierIntelligence/courierIntelligenceTypes";
import { suggestBestCourier as suggestBestCourierAi } from "@/components/courierIntelligence/aiCourierIntelligenceFoundation";

export function autoAssignCourier(
  request: CourierAssignmentRequest,
  now: Date = new Date(),
): CourierAutoAssignmentResult {
  const profiles = mergeCourierProfilesWithAdmin();

  const candidates = rankCourierCandidates(
    profiles
      .map((profile) => scoreCourierForAssignment(profile, request, now))
      .filter((candidate): candidate is NonNullable<typeof candidate> =>
        candidate !== null,
      ),
  );

  return {
    orderId: request.orderId,
    recommendedCourier: candidates[0] ?? null,
    candidates,
    generatedAt: now.toISOString(),
  };
}

export async function autoAssignCourierWithAi(
  request: CourierAssignmentRequest,
  now: Date = new Date(),
): Promise<CourierAutoAssignmentResult> {
  const base = autoAssignCourier(request, now);
  const aiCandidate = await suggestBestCourierAi(request);

  if (!aiCandidate) {
    return base;
  }

  const mergedCandidates = rankCourierCandidates([
    { ...aiCandidate, score: aiCandidate.score + 20, reasons: [...aiCandidate.reasons, "AI recommendation"] },
    ...base.candidates.filter(
      (candidate) => candidate.courier.id !== aiCandidate.courier.id,
    ),
  ]);

  return {
    ...base,
    recommendedCourier: mergedCandidates[0] ?? null,
    candidates: mergedCandidates,
  };
}
