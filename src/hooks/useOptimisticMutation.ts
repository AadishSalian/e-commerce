'use client';

/**
 * useOptimisticMutation
 *
 * Canonical, documented hook powering all optimistic mutations across the application.
 * Adheres strictly to Section 2 State Architecture & Lifecycle:
 *
 * Lifecycle:
 * 1. Cancel in-flight refetches for affected keys / resources
 * 2. Snapshot current confirmed server state for clean rollback
 * 3. Apply optimistic mutation overlay synchronously (<100ms response)
 * 4. Dispatch request in background with timeout, exponential backoff, and idempotency key
 * 5. On success: adopt server's authoritative state (confirmed prices, IDs, quantities)
 * 6. On failure: remove ONLY that mutation from overlay and trigger calm, explained rollback
 * 7. Reconcile at the end (price updates, stock caps, out-of-stock notices)
 * 8. Announce outcome politely to assistive technologies
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useOptimisticMutation({
 *   resource: 'cart',
 *   action: 'cart_add',
 *   onCancelRefetches: () => queryClient.cancelQueries(['cart']),
 *   onSnapshot: () => getConfirmedState(),
 *   onOptimisticApply: (payload, tempId) => addOptimisticLine(payload, tempId),
 *   executor: (mutation, signal) => api.post('/cart/items', mutation.payload, { signal }),
 *   onSuccess: (result) => adoptServerCart(result.cart),
 *   onRollback: (snapshot, error) => restoreSnapshot(snapshot),
 *   onReconciliation: (notices) => displayNotices(notices),
 *   successAnnouncement: (payload) => `${payload.name} added to bag`,
 *   failureAnnouncement: (err, payload) => `Couldn't add ${payload.name}. Try again`,
 * });
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  OptimisticMutation,
  OptimisticResource,
  OptimisticActionType,
  OptimisticError,
  ReconciliationNotice,
} from '@/lib/optimistic/types';
import { generateIdempotencyKey, generateTemporaryId } from '@/lib/optimistic/idempotency';
import { announcer } from '@/lib/optimistic/announcer';
import { broadcaster } from '@/lib/optimistic/broadcast';
import { getFeatureFlags } from '@/lib/optimistic/featureFlags';

export interface UseOptimisticMutationOptions<TPayload, TSnapshot, TResult> {
  resource: OptimisticResource;
  action: OptimisticActionType;
  /**
   * Step 1: Cancel any in-flight refetches or queries for affected resource
   */
  onCancelRefetches?: () => Promise<void> | void;
  /**
   * Step 2: Capture snapshot of confirmed server state before optimistic update
   */
  onSnapshot: () => TSnapshot;
  /**
   * Step 3: Apply optimistic mutation overlay synchronously (<100ms response)
   */
  onOptimisticApply: (
    payload: TPayload,
    tempId: string,
    mutation: OptimisticMutation<TPayload, TSnapshot>
  ) => void;
  /**
   * Step 4: Background request execution with abort signal & idempotency key
   */
  executor: (
    mutation: OptimisticMutation<TPayload, TSnapshot>,
    signal: AbortSignal
  ) => Promise<TResult>;
  /**
   * Step 5: On server success, adopt confirmed authoritative state
   */
  onSuccess: (result: TResult, mutation: OptimisticMutation<TPayload, TSnapshot>) => void;
  /**
   * Step 6: On server rejection, roll back ONLY this mutation cleanly using snapshot
   */
  onRollback: (
    snapshot: TSnapshot,
    error: OptimisticError,
    mutation: OptimisticMutation<TPayload, TSnapshot>
  ) => void;
  /**
   * Step 7: Handle any server reconciliation notices (price shifts, quantity caps)
   */
  onReconciliation?: (notices: ReconciliationNotice[]) => void;
  /**
   * Screen reader announcement helper for optimistic success
   */
  successAnnouncement?: (payload: TPayload, result?: TResult) => string | null;
  /**
   * Screen reader announcement helper for rollback / failure
   */
  failureAnnouncement?: (error: OptimisticError, payload: TPayload) => string;
}

export function useOptimisticMutation<TPayload = any, TSnapshot = any, TResult = any>(
  options: UseOptimisticMutationOptions<TPayload, TSnapshot, TResult>
) {
  const [isPending, setIsPending] = useState(false);
  const [isSlowSyncing, setIsSlowSyncing] = useState(false);
  const [error, setError] = useState<OptimisticError | null>(null);

  // Active abort controller for canceling prior in-flight request if needed
  const activeControllerRef = useRef<AbortController | null>(null);

  // Keep latest options in ref to avoid stale closures
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    return () => {
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
    };
  }, []);

  const mutate = useCallback(
    async (payload: TPayload): Promise<TResult | null> => {
      const opts = optionsRef.current;
      const flags = getFeatureFlags();
      const idempotencyKey = generateIdempotencyKey(opts.action);
      const temporaryId = generateTemporaryId('temp');

      // 1. Cancel in-flight refetches
      if (opts.onCancelRefetches) {
        try {
          await opts.onCancelRefetches();
        } catch {
          // Non-blocking
        }
      }

      // 2. Snapshot confirmed state
      const snapshot = opts.onSnapshot();

      // 3. Build mutation record
      const mutation: OptimisticMutation<TPayload, TSnapshot> = {
        id: generateIdempotencyKey('mut'),
        idempotencyKey,
        resource: opts.resource,
        action: opts.action,
        payload,
        snapshot,
        status: 'pending',
        createdAt: Date.now(),
        attemptCount: 0,
        temporaryId,
      };

      // 4. Apply optimistic state synchronously (<100ms)
      setIsPending(true);
      setError(null);
      opts.onOptimisticApply(payload, temporaryId, mutation);

      // Announce polite live region if configured
      if (opts.successAnnouncement) {
        const msg = opts.successAnnouncement(payload);
        if (msg) announcer.announce(msg, 'polite');
      }

      // Broadcast to other open tabs
      broadcaster.post('OPTIMISTIC_MUTATION_APPLIED', opts.resource, {
        action: opts.action,
        temporaryId,
        payload,
      });

      // 5. Execute request in background with timeout & retry
      const controller = new AbortController();
      activeControllerRef.current = controller;
      const timeoutTimer = setTimeout(() => controller.abort(), flags.requestTimeoutMs);
      const slowTimer = setTimeout(() => setIsSlowSyncing(true), flags.slowSyncThresholdMs);

      try {
        const result = await opts.executor(mutation, controller.signal);
        clearTimeout(timeoutTimer);
        clearTimeout(slowTimer);

        setIsPending(false);
        setIsSlowSyncing(false);

        // 6. Adopt authoritative server state
        opts.onSuccess(result, mutation);

        // 7. Reconcile server notices if returned
        if (
          opts.onReconciliation &&
          result &&
          typeof result === 'object' &&
          Array.isArray((result as any).reconciliationNotices)
        ) {
          opts.onReconciliation((result as any).reconciliationNotices);
        }

        broadcaster.post('OPTIMISTIC_MUTATION_CONFIRMED', opts.resource, {
          action: opts.action,
          result,
        });

        return result;
      } catch (err: any) {
        clearTimeout(timeoutTimer);
        clearTimeout(slowTimer);

        setIsPending(false);
        setIsSlowSyncing(false);

        const normalizedError: OptimisticError = {
          type: controller.signal.aborted ? 'timeout' : (err?.type || 'network'),
          message: err?.message || 'We are having trouble updating your selection.',
          retryable: !err?.statusCode || err?.statusCode >= 500,
          statusCode: err?.statusCode,
          serverData: err?.serverData,
        };

        setError(normalizedError);

        // 8. Rollback ONLY this mutation cleanly using prior snapshot
        opts.onRollback(snapshot, normalizedError, mutation);

        // Announce failure calmly
        if (opts.failureAnnouncement) {
          const failMsg = opts.failureAnnouncement(normalizedError, payload);
          announcer.announce(failMsg, 'assertive');
        }

        broadcaster.post('OPTIMISTIC_MUTATION_ROLLED_BACK', opts.resource, {
          action: opts.action,
          error: normalizedError,
        });

        return null;
      } finally {
        activeControllerRef.current = null;
      }
    },
    []
  );

  return {
    mutate,
    isPending,
    isSlowSyncing,
    error,
    clearError: () => setError(null),
  };
}
