// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админ-панель
//
// Purpose (EN):
// Route optimization recommendations assistant
//
// Назначение (RU):
// Ассистент оптимизации маршрутов
// ==================================================
"use client";

import styles from "@/components/admin/RouteOptimizationAssistant.module.css";
import {
  buildRouteOptimizationPlanFromOrders,
  getRouteOptimizationPriorityLabel,
  type RouteOptimizationCourierAnalysis,
  type RouteOptimizationHint,
  type RouteOptimizationPriority,
} from "@/components/admin/adminRouteOptimization";
import type { AdminOrderRecord } from "@/components/admin/adminOrderList";
import { useMemo } from "react";

type RouteOptimizationAssistantProps = {
  orders: AdminOrderRecord[];
  onOrderSelect: (orderId: string) => void;
};

function getHealthScoreClass(score: number): string {
  if (score >= 80) {
    return styles.healthScoreGood;
  }

  if (score >= 50) {
    return styles.healthScoreMedium;
  }

  return styles.healthScoreLow;
}

function getPriorityClass(priority: RouteOptimizationPriority): string {
  switch (priority) {
    case "high":
      return styles.priorityHigh;
    case "medium":
      return styles.priorityMedium;
    case "low":
    default:
      return styles.priorityLow;
  }
}

function OptimizationHintItem({
  hint,
  onOrderSelect,
}: {
  hint: RouteOptimizationHint;
  onOrderSelect: (orderId: string) => void;
}) {
  const content = (
    <>
      <div className={styles.hintTop}>
        <p className={styles.hintMessage}>{hint.message}</p>
        <span
          className={`${styles.priorityBadge} ${getPriorityClass(hint.priority)}`}
        >
          {getRouteOptimizationPriorityLabel(hint.priority)}
        </span>
      </div>
      {hint.orderId ? (
        <p className={styles.hintOrderLink}>Order {hint.orderId}</p>
      ) : null}
    </>
  );

  if (hint.orderId) {
    return (
      <li>
        <button
          type="button"
          className={styles.hintButton}
          onClick={() => onOrderSelect(hint.orderId!)}
        >
          {content}
        </button>
      </li>
    );
  }

  return (
    <li className={styles.hintItem}>
      {content}
    </li>
  );
}

function CourierOptimizationBlock({
  analysis,
  onOrderSelect,
}: {
  analysis: RouteOptimizationCourierAnalysis;
  onOrderSelect: (orderId: string) => void;
}) {
  return (
    <section
      className={styles.courierAnalysisBlock}
      aria-label={`${analysis.courierName} route optimization`}
    >
      <div className={styles.courierAnalysisTop}>
        <h4 className={styles.courierAnalysisTitle}>{analysis.courierName}</h4>
        <span className={styles.courierHealthBadge}>
          Route health {analysis.healthScore}
        </span>
      </div>

      {analysis.hints.length === 0 ? (
        <p className={styles.emptyHints}>Clean route — no optimization hints.</p>
      ) : (
        <ul className={styles.hintList}>
          {analysis.hints.map((hint) => (
            <OptimizationHintItem
              key={hint.id}
              hint={hint}
              onOrderSelect={onOrderSelect}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export function RouteOptimizationAssistant({
  orders,
  onOrderSelect,
}: RouteOptimizationAssistantProps) {
  const optimizationPlan = useMemo(
    () => buildRouteOptimizationPlanFromOrders(orders),
    [orders],
  );

  return (
    <section
      className={styles.optimizationSection}
      aria-label="Route optimization assistant"
    >
      <h3 className={styles.optimizationHeading}>Route Optimization</h3>
      <p className={styles.optimizationMeta}>
        Optimization hints based on route planning data. Read-only assistant.
      </p>

      <div className={styles.healthScoreCard}>
        <span>Overall route health</span>
        <strong
          className={`${styles.healthScoreValue} ${getHealthScoreClass(
            optimizationPlan.overallHealthScore,
          )}`}
        >
          {optimizationPlan.overallHealthScore}
        </strong>
      </div>

      {optimizationPlan.courierAnalyses.length === 0 ? (
        <p className={styles.emptyHints}>No courier routes to optimize yet.</p>
      ) : (
        optimizationPlan.courierAnalyses.map((analysis) => (
          <CourierOptimizationBlock
            key={analysis.courierId}
            analysis={analysis}
            onOrderSelect={onOrderSelect}
          />
        ))
      )}
    </section>
  );
}
