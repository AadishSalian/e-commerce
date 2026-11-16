import { TourConfig, TourPersistenceData } from './types';

export const TOUR_STORAGE_PREFIX = 'matte_coach_mark_';

/**
 * Generates the versioned storage key for a specific tour.
 */
export function getStorageKey(tourId: string, version: number): string {
  return `${TOUR_STORAGE_PREFIX}${tourId}_v${version}`;
}

/**
 * Checks if browser localStorage is available and writable.
 * In private browsing modes or restricted iframes, setItem can throw SecurityError / QuotaExceededError.
 */
export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__matte_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads persisted tour data safely from localStorage.
 */
export function readTourPersistence(tourId: string, version: number): TourPersistenceData | null {
  if (!isStorageAvailable()) return null;
  try {
    const key = getStorageKey(tourId, version);
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TourPersistenceData;
    if (parsed && parsed.id === tourId && parsed.version === version && parsed.status) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('[CoachMark] Failed to read tour persistence:', err);
    return null;
  }
}

/**
 * Writes persisted tour data safely to localStorage and optionally syncs with account.
 */
export function writeTourPersistence(data: TourPersistenceData): boolean {
  if (!isStorageAvailable()) return false;
  try {
    const key = getStorageKey(data.id, data.version);
    window.localStorage.setItem(key, JSON.stringify(data));
    
    // Also broadcast custom event for same-tab subscribers
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('matte-tour-state-change', {
          detail: data,
        })
      );
    }
    return true;
  } catch (err) {
    console.warn('[CoachMark] Failed to write tour persistence:', err);
    return false;
  }
}

/**
 * Records that a step was viewed during an active tour.
 */
export function recordTourStep(tourId: string, version: number, stepIndex: number): void {
  const existing = readTourPersistence(tourId, version);
  const data: TourPersistenceData = {
    id: tourId,
    version,
    status: existing?.status || 'interrupted',
    at: Date.now(),
    lastStep: stepIndex,
    interruptCount: existing?.interruptCount || 0,
  };
  writeTourPersistence(data);
}

/**
 * Marks a tour as permanently completed.
 */
export function markTourCompleted(tourId: string, version: number): void {
  const existing = readTourPersistence(tourId, version);
  const data: TourPersistenceData = {
    id: tourId,
    version,
    status: 'completed',
    at: Date.now(),
    lastStep: existing?.lastStep,
    interruptCount: existing?.interruptCount || 0,
  };
  writeTourPersistence(data);
}

/**
 * Marks a tour as permanently skipped.
 */
export function markTourSkipped(tourId: string, version: number, stepIndex?: number): void {
  const existing = readTourPersistence(tourId, version);
  const data: TourPersistenceData = {
    id: tourId,
    version,
    status: 'skipped',
    at: Date.now(),
    lastStep: stepIndex ?? existing?.lastStep ?? 0,
    interruptCount: existing?.interruptCount || 0,
  };
  writeTourPersistence(data);
}

/**
 * Marks a tour as interrupted (e.g., user navigated away or opened a modal).
 * Interrupted tours are permitted to show at most once more on a future visit.
 */
export function markTourInterrupted(tourId: string, version: number, stepIndex?: number): void {
  const existing = readTourPersistence(tourId, version);
  const currentCount = existing?.interruptCount || 0;
  const newCount = currentCount + 1;

  const data: TourPersistenceData = {
    id: tourId,
    version,
    // If interrupted more than once, treat as skipped permanently to prevent nagging
    status: newCount >= 2 ? 'skipped' : 'interrupted',
    at: Date.now(),
    lastStep: stepIndex ?? existing?.lastStep ?? 0,
    interruptCount: newCount,
  };
  writeTourPersistence(data);
}

/**
 * Checks whether the user is eligible for an automatic tour run based on storage rules:
 * - If storage is completely disabled/broken -> return false (default to quiet)
 * - If already marked 'completed' or 'skipped' -> return false
 * - If 'interrupted' but interruptCount >= 2 -> return false
 * - If no record exists -> first time visitor -> return true
 */
export function isEligibleByPersistence(tourConfig: TourConfig): boolean {
  if (!isStorageAvailable()) {
    // If storage is unavailable (e.g. strict security), default to not showing
    return false;
  }

  const record = readTourPersistence(tourConfig.id, tourConfig.version);
  if (!record) {
    // No record means first-time visitor
    return true;
  }

  if (record.status === 'completed' || record.status === 'skipped') {
    return false;
  }

  if (record.status === 'interrupted') {
    return (record.interruptCount || 0) < 2;
  }

  return false;
}

/**
 * Clears stored tour persistence for local development or testing.
 */
export function resetTourPersistence(tourId: string, version: number): void {
  if (!isStorageAvailable()) return;
  try {
    const key = getStorageKey(tourId, version);
    window.localStorage.removeItem(key);
  } catch {}
}
