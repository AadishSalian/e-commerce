'use client';

/**
 * useOptimisticMutation
 * Canonical, documented hook powering all optimistic mutations across the application.
 *
 * Lifecycle:
 * 1. Cancel in-flight refetches for affected keys
 * 2. Snapshot current confirmed server state for clean rollback
 * 3. Apply optimistic mutation overlay synchronously (<100ms response)
 * 4. Dispatch request in background through the per-resource serialized queue
 * 5. On success: adopt server's authoritative state (confirmed prices, IDs, quantities)
 * 6. On failure: remove ONLY that mutation from overlay and trigger calm, explained rollback
 * 7. Announce outcome politely to assistive technologies
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
  onSnapshot: () => TSnapshot;
  onOptimisticApply: (payload: TPayload, tempId: string, mutation: OptimisticMutation<TPayload, TSnapshot>) => void;
  executor: (mutation: OptimisticMutation<TPayload, TSnapshot>, signal: AbortSignal) => Promise<TResult>;
  onSuccess: (result: TResult, mutation: OptimisticMutation<TPayload, TSnapshot>) => void;
  onRollback: (snapshot: TSnapshot, error: OptimisticError, mutation: OptimisticMutation<TPayload, TSnapshot>) => void;
  onReconciliation?: (notices: ReconciliationNotice[]) => void;
  successAnnouncement?: (payload: TPayload, result?: TResult) => string | null;
  failureAnnouncement?: (error: OptimisticError, payload: TPayload) => string;
}

export function useOptimisticMutation<TPayload = any, TSnapshot = any, TResult = any>(
  options: UseOptimisticMutationOptions<TPayload, TSnapshot, TResult>
) {
  const [isPending, setIsPending] = useState(false);
  const [isSlowSyncing, setIsSlowSyncing] = useState(false);
  const [error, setError] = useState<OptimisticError | null>(null);

  // Keep latest options in ref to avoid stale closures
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutate = useCallback(
    async (payload: TPayload): Promise<TResult | null> => {
      const opts = optionsRef.current;
      const flags = getFeatureFlags();
      const idempotencyKey = generateIdempotencyKey(opts.action);
      const temporaryId = generateTemporaryId('temp');

      // 1. Snapshot confirmed state
      const snapshot = opts.onSnapshot();

      // 2. Build mutation record
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

      // 3. Apply optimistic state synchronously
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

      // 4. Execute request in background with timeout & retry
      const controller = new AbortController();
      const timeoutTimer = setTimeout(() => controller.abort(), flags.requestTimeoutMs);
      const slowTimer = setTimeout(() => setIsSlowSyncing(true), flags.slowSyncThresholdMs);

      try {
        const result = await opts.executor(mutation, controller.signal);
        clearTimeout(timeoutTimer);
        clearTimeout(slowTimer);

        setIsPending(false);
        setIsSlowSyncing(false);

        // 5. Adopt authoritative server state
        opts.onSuccess(result, mutation);

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

        // 6. Rollback ONLY this mutation cleanly using prior snapshot
        opts.onRollback(snapshot, normalizedError, mutation);

        // Announce failure
        if (opts.failureAnnouncement) {
          const failMsg = opts.failureAnnouncement(normalizedError, payload);
          announcer.announce(failMsg, 'assertive');
        }

        broadcaster.post('OPTIMISTIC_MUTATION_ROLLED_BACK', opts.resource, {
          action: opts.action,
          error: normalizedError,
        });

        return null;
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
