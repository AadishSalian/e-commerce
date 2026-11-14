/**
 * Privacy-safe, consent-aware instrumentation for the Optimistic UI Layer.
 * Tracks rollback rates, retry rates, confirmation latencies, and reconciliation diffs
 * without collecting PII or cart item details.
 */

import {
  TelemetryMetrics,
  OptimisticResource,
  OptimisticErrorType,
  ReconciliationType,
} from './types';

class OptimisticTelemetry {
  private metrics: TelemetryMetrics = {
    totalMutations: 0,
    successfulMutations: 0,
    failedMutations: 0,
    rolledBackMutations: 0,
    retriedMutations: 0,
    averageConfirmationMs: 0,
    reconciliationDiffsByType: {
      price_updated: 0,
      quantity_capped: 0,
      item_unavailable: 0,
      cart_merged: 0,
      free_shipping_shifted: 0,
      coupon_recalculated: 0,
    },
    rollbacksByReason: {
      network: 0,
      timeout: 0,
      stock_capped: 0,
      out_of_stock: 0,
      price_changed: 0,
      conflict: 0,
      rate_limited: 0,
      unauthorized: 0,
      validation: 0,
      unknown: 0,
    },
  };

  private confirmationDurations: number[] = [];
  private readonly MAX_SAMPLES = 100;
  private readonly ROLLBACK_ALERT_THRESHOLD = 0.1; // 10%

  recordMutationStart(resource: OptimisticResource, action: string): void {
    this.metrics.totalMutations++;
  }

  recordMutationSuccess(resource: OptimisticResource, action: string, durationMs: number): void {
    this.metrics.successfulMutations++;
    this.recordDuration(durationMs);
  }

  recordMutationRetry(resource: OptimisticResource, action: string, attempt: number): void {
    this.metrics.retriedMutations++;
  }

  recordMutationRollback(
    resource: OptimisticResource,
    action: string,
    reason: OptimisticErrorType
  ): void {
    this.metrics.failedMutations++;
    this.metrics.rolledBackMutations++;
    this.metrics.rollbacksByReason[reason] = (this.metrics.rollbacksByReason[reason] || 0) + 1;

    // Check if rollback rate exceeds threshold
    this.evaluateRollbackRate();
  }

  recordReconciliationDiff(type: ReconciliationType): void {
    this.metrics.reconciliationDiffsByType[type] =
      (this.metrics.reconciliationDiffsByType[type] || 0) + 1;
  }

  private recordDuration(ms: number): void {
    if (ms <= 0) return;
    this.confirmationDurations.push(ms);
    if (this.confirmationDurations.length > this.MAX_SAMPLES) {
      this.confirmationDurations.shift();
    }
    const sum = this.confirmationDurations.reduce((acc, val) => acc + val, 0);
    this.metrics.averageConfirmationMs = Math.round(sum / this.confirmationDurations.length);
  }

  private evaluateRollbackRate(): void {
    if (this.metrics.totalMutations >= 10) {
      const rollbackRate = this.metrics.rolledBackMutations / this.metrics.totalMutations;
      if (rollbackRate > this.ROLLBACK_ALERT_THRESHOLD) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn(
            `[Optimistic Telemetry Alert] High rollback rate detected: ${(
              rollbackRate * 100
            ).toFixed(1)}% (${this.metrics.rolledBackMutations}/${this.metrics.totalMutations})`
          );
        }
      }
    }
  }

  getMetrics(): TelemetryMetrics {
    return {
      ...this.metrics,
      reconciliationDiffsByType: { ...this.metrics.reconciliationDiffsByType },
      rollbacksByReason: { ...this.metrics.rollbacksByReason },
    };
  }

  reset(): void {
    this.confirmationDurations = [];
    this.metrics = {
      totalMutations: 0,
      successfulMutations: 0,
      failedMutations: 0,
      rolledBackMutations: 0,
      retriedMutations: 0,
      averageConfirmationMs: 0,
      reconciliationDiffsByType: {
        price_updated: 0,
        quantity_capped: 0,
        item_unavailable: 0,
        cart_merged: 0,
        free_shipping_shifted: 0,
        coupon_recalculated: 0,
      },
      rollbacksByReason: {
        network: 0,
        timeout: 0,
        stock_capped: 0,
        out_of_stock: 0,
        price_changed: 0,
        conflict: 0,
        rate_limited: 0,
        unauthorized: 0,
        validation: 0,
        unknown: 0,
      },
    };
  }
}

export const telemetry = new OptimisticTelemetry();
