'use client';

import { useState, useCallback } from 'react';
import { announcer } from '@/lib/optimistic/announcer';

export interface UsePendingActionOptions {
  onExecute: () => Promise<any>;
  pendingAnnouncement?: string;
  successAnnouncement?: string;
  failureAnnouncement?: string;
}

export function usePendingAction(options: UsePendingActionOptions) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setIsPending(true);
    setError(null);

    if (options.pendingAnnouncement) {
      announcer.announce(options.pendingAnnouncement, 'polite');
    }

    try {
      const result = await options.onExecute();
      if (options.successAnnouncement) {
        announcer.announce(options.successAnnouncement, 'polite');
      }
      return result;
    } catch (err: any) {
      setError(err);
      if (options.failureAnnouncement) {
        announcer.announce(options.failureAnnouncement, 'assertive');
      }
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [options]);

  return {
    execute,
    isPending,
    error,
    clearError: () => setError(null),
  };
}
