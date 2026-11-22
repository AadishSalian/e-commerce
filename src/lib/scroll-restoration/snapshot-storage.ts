import { ScrollSnapshot, FilterUIState, LastListingRecord, HistoryEntryState } from './types';

export const SNAPSHOT_STORAGE_KEY = '__sr_snapshots_v1';
export const FILTER_UI_STORAGE_KEY_PREFIX = '__sr_filter_ui_';
export const LAST_LISTING_STORAGE_KEY = '__sr_last_listing_v1';

export const CURRENT_SCHEMA_VERSION = 1;
export const MAX_SNAPSHOT_AGE_MS = 30 * 60 * 1000; // 30 minutes
export const MAX_SNAPSHOT_COUNT = 20; // Size cap

/**
 * Generates a collision-resistant unique entry ID for history states.
 */
export function generateHistoryEntryId(): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `sr_${time}_${rand}`;
}

/**
 * Safely accesses window.sessionStorage with privacy / error guards.
 */
function getSafeSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    const testKey = '__sr_test__';
    window.sessionStorage.setItem(testKey, '1');
    window.sessionStorage.removeItem(testKey);
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Retrieves the current history entry ID from window.history.state,
 * generating and assigning a fresh one if not already present.
 */
export function ensureHistoryEntryId(): string {
  if (typeof window === 'undefined') return 'ssr_entry';

  try {
    const state = (window.history.state || {}) as HistoryEntryState;
    if (state.__sr_entry_id) {
      return state.__sr_entry_id;
    }

    const newId = generateHistoryEntryId();
    const nextState: HistoryEntryState = {
      ...state,
      __sr_entry_id: newId,
      __sr_type: 'fresh',
    };

    window.history.replaceState(nextState, '', window.location.href);
    return newId;
  } catch {
    return generateHistoryEntryId();
  }
}

/**
 * Reads all stored snapshots from sessionStorage, evicting stale and over-capacity records.
 */
function readSnapshotsMap(): Map<string, ScrollSnapshot> {
  const storage = getSafeSessionStorage();
  const map = new Map<string, ScrollSnapshot>();
  if (!storage) return map;

  try {
    const raw = storage.getItem(SNAPSHOT_STORAGE_KEY);
    if (!raw) return map;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return map;

    const now = Date.now();

    for (const item of parsed) {
      // Schema & integrity validation
      if (
        item &&
        typeof item === 'object' &&
        item.schemaVersion === CURRENT_SCHEMA_VERSION &&
        typeof item.key === 'string' &&
        typeof item.url === 'string' &&
        typeof item.scrollY === 'number' &&
        typeof item.savedAt === 'number' &&
        now - item.savedAt <= MAX_SNAPSHOT_AGE_MS
      ) {
        map.set(item.key, {
          key: item.key,
          url: item.url,
          scrollY: Math.max(0, Math.round(item.scrollY)),
          anchorProductId: typeof item.anchorProductId === 'string' ? item.anchorProductId : '',
          anchorOffset: typeof item.anchorOffset === 'number' ? Math.round(item.anchorOffset) : 0,
          loadedPages: typeof item.loadedPages === 'number' && item.loadedPages >= 1 ? item.loadedPages : 1,
          viewport: {
            w: item.viewport?.w || 1280,
            h: item.viewport?.h || 800,
          },
          savedAt: item.savedAt,
          schemaVersion: CURRENT_SCHEMA_VERSION,
        });
      }
    }
  } catch (err) {
    console.warn('[ScrollRestoration] Failed to read snapshots map:', err);
  }

  return map;
}

/**
 * Writes the snapshots map back to sessionStorage, enforcing maximum cap (latest 20).
 */
function writeSnapshotsMap(map: Map<string, ScrollSnapshot>): void {
  const storage = getSafeSessionStorage();
  if (!storage) return;

  try {
    // Sort by savedAt descending, take at most MAX_SNAPSHOT_COUNT
    const entries = Array.from(map.values())
      .sort((a, b) => b.savedAt - a.savedAt)
      .slice(0, MAX_SNAPSHOT_COUNT);

    storage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('[ScrollRestoration] Failed to persist snapshot:', err);
  }
}

/**
 * Saves a scroll snapshot for the given history entry ID.
 */
export function saveSnapshot(snapshot: ScrollSnapshot): void {
  if (!snapshot || !snapshot.key) return;

  const map = readSnapshotsMap();
  map.set(snapshot.key, {
    ...snapshot,
    savedAt: snapshot.savedAt || Date.now(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
  });
  writeSnapshotsMap(map);
}

/**
 * Retrieves a valid, unexpired scroll snapshot for the given history entry ID.
 */
export function getSnapshot(entryId: string): ScrollSnapshot | null {
  if (!entryId) return null;
  const map = readSnapshotsMap();
  const snapshot = map.get(entryId);
  if (!snapshot) return null;

  // Double check expiration
  if (Date.now() - snapshot.savedAt > MAX_SNAPSHOT_AGE_MS) {
    map.delete(entryId);
    writeSnapshotsMap(map);
    return null;
  }

  return snapshot;
}

/**
 * Deletes a snapshot for a specific entry ID (e.g. after successful restoration).
 */
export function deleteSnapshot(entryId: string): void {
  if (!entryId) return;
  const map = readSnapshotsMap();
  if (map.delete(entryId)) {
    writeSnapshotsMap(map);
  }
}

/**
 * Clears all stored snapshots (useful for tests or hard resets).
 */
export function clearAllSnapshots(): void {
  const storage = getSafeSessionStorage();
  if (storage) {
    try {
      storage.removeItem(SNAPSHOT_STORAGE_KEY);
    } catch {}
  }
}

/**
 * Saves non-URL filter UI state (expanded groups, view mode, show more).
 */
export function saveFilterUIState(listingId: string, state: FilterUIState): void {
  const storage = getSafeSessionStorage();
  if (!storage || !listingId) return;

  try {
    storage.setItem(`${FILTER_UI_STORAGE_KEY_PREFIX}${listingId}`, JSON.stringify(state));
  } catch {}
}

/**
 * Retrieves non-URL filter UI state.
 */
export function getFilterUIState(listingId: string): FilterUIState | null {
  const storage = getSafeSessionStorage();
  if (!storage || !listingId) return null;

  try {
    const raw = storage.getItem(`${FILTER_UI_STORAGE_KEY_PREFIX}${listingId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Records the last visited listing page to power the smart "Back to results" link.
 */
export function saveLastListing(record: LastListingRecord): void {
  const storage = getSafeSessionStorage();
  if (!storage) return;

  try {
    storage.setItem(LAST_LISTING_STORAGE_KEY, JSON.stringify(record));
  } catch {}
}

/**
 * Retrieves the last visited listing page record.
 */
export function getLastListing(): LastListingRecord | null {
  const storage = getSafeSessionStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(LAST_LISTING_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.url === 'string') {
      return parsed;
    }
  } catch {}

  return null;
}
