// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админ-панель
//
// Purpose (EN):
// Smart dispatch courier assignment recommendations
//
// Назначение (RU):
// Рекомендации умной диспетчеризации курьеров
// ==================================================
"use client";

import styles from "@/components/admin/SmartDispatchRecommendation.module.css";
import {
  buildSmartDispatchRecommendation,
  type SmartDispatchRecommendation,
} from "@/components/admin/smartDispatchAssistant";
import type { AdminOrderRecord } from "@/components/admin/adminOrderList";
import { useMemo } from "react";

type SmartDispatchRecommendationProps = {
  order: AdminOrderRecord;
  allOrders: AdminOrderRecord[];
  onAssignRecommended: (courierId: string) => void | Promise<void>;
  assigning?: boolean;
  assignError?: string;
  assignNotice?: string;
};

function SmartDispatchRecommendationView({
  recommendation,
  onAssignRecommended,
  assigning = false,
  assignError = "",
  assignNotice = "",
}: {
  recommendation: SmartDispatchRecommendation;
  onAssignRecommended: (courierId: string) => void | Promise<void>;
  assigning?: boolean;
  assignError?: string;
  assignNotice?: string;
}) {
  return (
    <section
      className={styles.smartDispatchBlock}
      aria-label="Smart dispatch recommendation"
      onClick={(event) => event.stopPropagation()}
    >
      <p className={styles.smartDispatchTitle}>Smart Recommendation</p>
      <p className={styles.smartDispatchLabel}>Recommended</p>
      <p className={styles.smartDispatchRecommended}>
        {recommendation.courierName}
      </p>

      <p className={styles.smartDispatchLabel}>Reason</p>
      <ul className={styles.reasonList}>
        {recommendation.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>

      <p className={styles.smartDispatchLabel}>Workload</p>
      <ul className={styles.workloadList}>
        {recommendation.workloadSummary.map((entry) => (
          <li key={entry.courierId} className={styles.workloadRow}>
            <span>{entry.courierName}</span>
            <strong>{entry.deliveryCount}</strong>
          </li>
        ))}
      </ul>

      {recommendation.conflictWarnings.length > 0 ? (
        <>
          <p className={styles.smartDispatchLabel}>Conflicts</p>
          <ul className={styles.warningList}>
            {recommendation.conflictWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </>
      ) : null}

      <button
        type="button"
        className={styles.assignButton}
        disabled={assigning}
        onClick={() => void onAssignRecommended(recommendation.courierId)}
      >
        {assigning ? "Assigning..." : "Assign Recommended Courier"}
      </button>

      {assignError ? (
        <p className={styles.smartDispatchError} role="alert">
          {assignError}
        </p>
      ) : null}
      {assignNotice ? (
        <p className={styles.smartDispatchNotice} role="status">
          {assignNotice}
        </p>
      ) : null}
    </section>
  );
}

export function SmartDispatchRecommendation({
  order,
  allOrders,
  onAssignRecommended,
  assigning = false,
  assignError = "",
  assignNotice = "",
}: SmartDispatchRecommendationProps) {
  const recommendation = useMemo(
    () => buildSmartDispatchRecommendation(order, allOrders),
    [allOrders, order],
  );

  if (!recommendation) {
    return null;
  }

  return (
    <SmartDispatchRecommendationView
      recommendation={recommendation}
      onAssignRecommended={onAssignRecommended}
      assigning={assigning}
      assignError={assignError}
      assignNotice={assignNotice}
    />
  );
}
