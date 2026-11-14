/**
 * Outbox Storage & Lifecycle
 * Persists pending mutations locally to survive page reloads, tab closures,
 * and offline spells. Deduplicates by idempotency key, caps queue size and age,
 * and purges stale items cleanly.
 */

import { OptimisticMutation } from './types';

export const OUTBOX_STORAGE_KEY = 'matte_optimistic_outbox_v1';
export const MAX_OUTBOX_ITEMS = 50;
export const MAX_OUTBOX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface OutboxState {
  version: number;
  updatedAt: number;
  items: OptimisticMutation[];
}

export class OptimisticOutbox {
  private memoryItems: OptimisticMutation[] = [];
  private onStaleItemsPurged?: (purgedCount: number) => void;

  constructor(onStalePurged?: (purgedCount: number) => void) {
    this.onStaleItemsPurged = onStalePurged;
    this.loadFromStorage();
  }

  loadFromStorage(): OptimisticMutation[] {
    if (typeof window === 'undefined') return [];

    try {
      const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
      if (!raw) {
        this.memoryItems = [];
        return [];
      }

      const parsed: OutboxState = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.items)) {
        this.memoryItems = [];
        return [];
      }

      const now = Date.now();
      const valid: OptimisticMutation[] = [];
      let staleCount = 0;

      for (const item of parsed.items) {
        // Enforce age limit (24 hours)
        if (now - item.createdAt <= MAX_OUTBOX_AGE_MS) {
          valid.push(item);
        } else {
          staleCount++;
        }
      }

      // Cap at MAX_OUTBOX_ITEMS
      if (valid.length > MAX_OUTBOX_ITEMS) {
        valid.splice(0, valid.length - MAX_OUTBOX_ITEMS);
      }

      this.memoryItems = valid;

      if (staleCount > 0 && this.onStaleItemsPurged) {
        this.onStaleItemsPurged(staleCount);
      }

      this.saveToStorage();
      return [...this.memoryItems];
    } catch {
      this.memoryItems = [];
      return [];
    }
  }

  saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const state: OutboxState = {
        version: 1,
        updatedAt: Date.now(),
        items: this.memoryItems,
      };
      localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage write issues (quota/private browsing)
    }
  }

  enqueue(mutation: OptimisticMutation): void {
    // Deduplicate by idempotency key
    const existingIndex = this.memoryItems.findIndex(
      (m) => m.idempotencyKey === mutation.idempotencyKey
    );

    if (existingIndex >= 0) {
      this.memoryItems[existingIndex] = mutation;
    } else {
      this.memoryItems.push(mutation);
    }

    // Cap at max items
    if (this.memoryItems.length > MAX_OUTBOX_ITEMS) {
      this.memoryItems.shift();
    }

    this.saveToStorage();
  }

  dequeue(idempotencyKey: string): OptimisticMutation | null {
    const index = this.memoryItems.findIndex((m) => m.idempotencyKey === idempotencyKey);
    if (index === -1) return null;

    const [removed] = this.memoryItems.splice(index, 1);
    this.saveToStorage();
    return removed;
  }

  updateItem(
    idempotencyKey: string,
    updater: (m: OptimisticMutation) => OptimisticMutation
  ): void {
    const index = this.memoryItems.findIndex((m) => m.idempotencyKey === idempotencyKey);
    if (index !== -1) {
      this.memoryItems[index] = updater(this.memoryItems[index]);
      this.saveToStorage();
    }
  }

  getItems(): OptimisticMutation[] {
    return [...this.memoryItems];
  }

  getItemsForResource(resource: string): OptimisticMutation[] {
    return this.memoryItems.filter((m) => m.resource === resource);
  }

  clear(): void {
    this.memoryItems = [];
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(OUTBOX_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
  }
}

export const outbox = new OptimisticOutbox();
