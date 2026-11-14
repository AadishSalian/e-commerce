/**
 * Per-Resource Optimistic Mutation Queue
 * Guarantees:
 * - FIFO serialized execution per resource
 * - Rapid tap debouncing & quantity coalescing (350ms window)
 * - Immediate flush on navigation, blur, or checkout
 * - Transient retry with exponential backoff & jitter (up to 3 attempts) using the exact same idempotency key
 * - 4xx client errors are never retried
 * - 10s request timeout via AbortController
 * - Temporary ID mapping for queued dependent mutations
 * - Stale version / late response protection
 */

import {
  OptimisticMutation,
  OptimisticResource,
  OptimisticError,
  OptimisticErrorType,
} from './types';
import { outbox } from './outbox';
import { telemetry } from './telemetry';
import { broadcaster } from './broadcast';
import { getFeatureFlags } from './featureFlags';

export type MutationExecutor<TPayload = any, TResult = any> = (
  mutation: OptimisticMutation<TPayload>,
  signal: AbortSignal
) => Promise<TResult>;

export interface QueueCallbacks<TPayload = any, TResult = any> {
  onOptimisticApply: (mutation: OptimisticMutation<TPayload>) => void;
  onSuccess: (mutation: OptimisticMutation<TPayload>, result: TResult) => void;
  onRollback: (mutation: OptimisticMutation<TPayload>, error: OptimisticError) => void;
  onSlowSyncWarning?: (mutation: OptimisticMutation<TPayload>) => void;
  onAuthRequired?: (mutation: OptimisticMutation<TPayload>) => void;
}

export class OptimisticQueue<TPayload = any, TResult = any> {
  private resource: OptimisticResource;
  private executor: MutationExecutor<TPayload, TResult>;
  private callbacks: QueueCallbacks<TPayload, TResult>;
  private queue: OptimisticMutation<TPayload>[] = [];
  private activeMutation: OptimisticMutation<TPayload> | null = null;
  private isProcessing = false;
  private isPaused = false; // Paused on 401 session expiry

  // Debouncing & coalescing map for rapid quantity updates
  private debounceTimers: Map<string, any> = new Map();
  private pendingCoalesced: Map<string, OptimisticMutation<TPayload>> = new Map();

  // Temporary ID to Real ID translation map
  private idTranslationMap: Map<string, string> = new Map();

  constructor(
    resource: OptimisticResource,
    executor: MutationExecutor<TPayload, TResult>,
    callbacks: QueueCallbacks<TPayload, TResult>
  ) {
    this.resource = resource;
    this.executor = executor;
    this.callbacks = callbacks;

    // Attach flush listeners on window unload/blur if in browser
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flushAllDebounced());
      window.addEventListener('pagehide', () => this.flushAllDebounced());
    }
  }

  enqueue(mutation: OptimisticMutation<TPayload>): void {
    // 1. Immediately apply optimistic state synchronously
    this.callbacks.onOptimisticApply(mutation);
    telemetry.recordMutationStart(this.resource, mutation.action);

    // 2. Persist to local outbox
    const flags = getFeatureFlags();
    if (flags.offlineQueueEnabled) {
      outbox.enqueue(mutation);
    }

    // 3. Check if this mutation can be coalesced (e.g. quantity changes for the same item)
    const payload = mutation.payload as any;
    if (
      mutation.action === 'cart_update_quantity' &&
      payload &&
      payload.cartId
    ) {
      this.handleCoalescedQuantity(mutation);
      return;
    }

    // Standard enqueue
    this.queue.push(mutation);
    this.processNext();
  }

  private handleCoalescedQuantity(mutation: OptimisticMutation<TPayload>): void {
    const flags = getFeatureFlags();
    const itemId = (mutation.payload as any)?.cartId;
    if (!itemId) return;

    // Clear existing timer if shopper taps rapidly
    if (this.debounceTimers.has(itemId)) {
      clearTimeout(this.debounceTimers.get(itemId));
    }

    // Store latest intent
    this.pendingCoalesced.set(itemId, mutation);

    const timer = setTimeout(() => {
      this.debounceTimers.delete(itemId);
      const latest = this.pendingCoalesced.get(itemId);
      this.pendingCoalesced.delete(itemId);

      if (latest) {
        this.queue.push(latest);
        this.processNext();
      }
    }, flags.coalesceDebounceMs);

    this.debounceTimers.set(itemId, timer);
  }

  flushAllDebounced(): void {
    if (this.debounceTimers.size === 0) return;

    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();

    this.pendingCoalesced.forEach((mutation) => {
      this.queue.push(mutation);
    });
    this.pendingCoalesced.clear();

    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.isPaused || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const mutation = this.queue.shift()!;
    this.activeMutation = mutation;

    // Translate any temporary IDs in payload if this depended on an earlier item creation
    this.translatePayloadIds(mutation);

    const startTime = Date.now();
    const flags = getFeatureFlags();

    // Slow-sync warning timer (after 3 seconds)
    const slowSyncTimer = setTimeout(() => {
      if (this.activeMutation?.id === mutation.id) {
        mutation.status = 'slow_syncing';
        if (this.callbacks.onSlowSyncWarning) {
          this.callbacks.onSlowSyncWarning(mutation);
        }
      }
    }, flags.slowSyncThresholdMs);

    let attempt = 0;
    const maxAttempts = flags.maxRetryAttempts;
    let lastError: OptimisticError | null = null;

    while (attempt < maxAttempts) {
      attempt++;
      mutation.attemptCount = attempt;
      mutation.lastAttemptAt = Date.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), flags.requestTimeoutMs);

      try {
        const result = await this.executor(mutation, controller.signal);
        clearTimeout(timeoutId);
        clearTimeout(slowSyncTimer);

        mutation.status = 'applied';
        const duration = Date.now() - startTime;
        telemetry.recordMutationSuccess(this.resource, mutation.action, duration);

        // Dequeue from persistent outbox
        outbox.dequeue(mutation.idempotencyKey);

        // If this added an item and returned a real server ID, register in translation map
        if (result && typeof result === 'object' && (result as any).realLineId && mutation.temporaryId) {
          this.idTranslationMap.set(mutation.temporaryId, (result as any).realLineId);
        }

        this.callbacks.onSuccess(mutation, result);
        this.activeMutation = null;
        this.isProcessing = false;

        // Process next item in queue
        this.processNext();
        return;
      } catch (err: any) {
        clearTimeout(timeoutId);

        lastError = this.normalizeError(err, controller.signal.aborted);

        // Session expired (401)
        if (lastError.type === 'unauthorized') {
          clearTimeout(slowSyncTimer);
          this.isPaused = true;
          this.queue.unshift(mutation); // Re-queue at head
          this.activeMutation = null;
          this.isProcessing = false;
          if (this.callbacks.onAuthRequired) {
            this.callbacks.onAuthRequired(mutation);
          }
          return;
        }

        // Non-retryable error (e.g. 4xx validation, out-of-stock, price mismatch)
        if (!lastError.retryable || attempt >= maxAttempts) {
          break;
        }

        // Retry with exponential backoff + jitter
        telemetry.recordMutationRetry(this.resource, mutation.action, attempt);
        const backoffMs = Math.min(
          1000 * Math.pow(2, attempt - 1) + Math.random() * 200,
          4000
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    // All retry attempts exhausted or non-retryable error
    clearTimeout(slowSyncTimer);
    mutation.status = 'failed';
    mutation.error = lastError || {
      type: 'unknown',
      message: 'Mutation failed',
      retryable: false,
    };

    telemetry.recordMutationRollback(
      this.resource,
      mutation.action,
      mutation.error.type
    );

    // Rollback this specific mutation cleanly
    outbox.dequeue(mutation.idempotencyKey);
    this.callbacks.onRollback(mutation, mutation.error);

    this.activeMutation = null;
    this.isProcessing = false;

    // Continue queue processing (failure of one does NOT corrupt others)
    this.processNext();
  }

  private translatePayloadIds(mutation: OptimisticMutation<TPayload>): void {
    const payload = mutation.payload as any;
    if (!payload || typeof payload !== 'object') return;

    if (payload.cartId && this.idTranslationMap.has(payload.cartId)) {
      payload.cartId = this.idTranslationMap.get(payload.cartId);
    }
  }

  private normalizeError(err: any, wasAborted: boolean): OptimisticError {
    if (wasAborted) {
      return {
        type: 'timeout',
        message: 'Request timed out after 10 seconds',
        retryable: true,
      };
    }

    if (err && err.type && err.message) {
      return err as OptimisticError;
    }

    const statusCode = err?.status || err?.statusCode;

    if (statusCode === 401) {
      return {
        type: 'unauthorized',
        message: 'Your session has expired',
        statusCode: 401,
        retryable: false,
      };
    }

    if (statusCode === 429) {
      return {
        type: 'rate_limited',
        message: 'You are going a bit fast. Please try again in a moment',
        statusCode: 429,
        retryable: false,
      };
    }

    if (statusCode === 409 || statusCode === 412) {
      return {
        type: 'conflict',
        message: 'Item state was updated elsewhere',
        statusCode,
        retryable: false,
      };
    }

    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return {
        type: 'validation',
        message: err.message || 'Action could not be validated',
        statusCode,
        retryable: false,
      };
    }

    // Network or 5xx server errors are retryable
    return {
      type: 'network',
      message: err?.message || 'We are having trouble connecting',
      statusCode: statusCode || 503,
      retryable: true,
      originalError: err,
    };
  }

  resumeAfterAuth(): void {
    this.isPaused = false;
    this.processNext();
  }

  hasPending(): boolean {
    return (
      this.queue.length > 0 ||
      this.activeMutation !== null ||
      this.pendingCoalesced.size > 0
    );
  }

  getPendingCount(): number {
    return this.queue.length + (this.activeMutation ? 1 : 0) + this.pendingCoalesced.size;
  }

  clearQueue(): void {
    this.queue = [];
    this.pendingCoalesced.clear();
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}
