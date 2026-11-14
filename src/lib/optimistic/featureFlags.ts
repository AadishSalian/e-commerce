import { OptimisticFeatureFlags } from './types';

export const DEFAULT_FEATURE_FLAGS: OptimisticFeatureFlags = {
  optimisticCart: true,
  optimisticWishlist: true,
  optimisticCompare: true,
  optimisticNotifications: true,
  offlineQueueEnabled: true,
  coalesceDebounceMs: 350,
  requestTimeoutMs: 10000,
  slowSyncThresholdMs: 3000,
  maxRetryAttempts: 3,
};

let currentFlags: OptimisticFeatureFlags = { ...DEFAULT_FEATURE_FLAGS };

const FLAG_STORAGE_KEY = 'matte_optimistic_feature_flags_v1';

export function getFeatureFlags(): OptimisticFeatureFlags {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(FLAG_STORAGE_KEY);
      if (stored) {
        currentFlags = { ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore localStorage read errors
    }
  }
  return currentFlags;
}

export function updateFeatureFlags(overrides: Partial<OptimisticFeatureFlags>): OptimisticFeatureFlags {
  currentFlags = { ...currentFlags, ...overrides };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(FLAG_STORAGE_KEY, JSON.stringify(currentFlags));
    } catch {
      // Ignore localStorage write errors
    }
  }
  return currentFlags;
}

export function resetFeatureFlags(): void {
  currentFlags = { ...DEFAULT_FEATURE_FLAGS };
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(FLAG_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}
