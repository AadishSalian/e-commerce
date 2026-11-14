/**
 * Cross-Tab Concurrency & Synchronization
 * Broadcasts optimistic mutations, server confirmations, and reconciliation events
 * across tabs using BroadcastChannel, with window storage fallback for compatibility.
 */

import { CrossTabMessage, OptimisticResource } from './types';
import { generateUUID } from './idempotency';

const CHANNEL_NAME = 'matte_optimistic_sync_channel';
const STORAGE_EVENT_KEY = 'matte_optimistic_crosstab_event';

export const CURRENT_TAB_ID = typeof window !== 'undefined' ? generateUUID().slice(0, 8) : 'server';

export type CrossTabListener = (message: CrossTabMessage) => void;

class OptimisticBroadcaster {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<CrossTabListener> = new Set();
  private isSupported = typeof window !== 'undefined';

  constructor() {
    this.init();
  }

  private init(): void {
    if (!this.isSupported) return;

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data && event.data.sourceTabId !== CURRENT_TAB_ID) {
            this.notifyListeners(event.data);
          }
        };
      } catch {
        // Fallback below
      }
    }

    // Storage event fallback for browsers without BroadcastChannel or in iframes
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_EVENT_KEY && event.newValue) {
          try {
            const data: CrossTabMessage = JSON.parse(event.newValue);
            if (data && data.sourceTabId !== CURRENT_TAB_ID) {
              this.notifyListeners(data);
            }
          } catch {
            // Ignore parse errors
          }
        }
      });
    }
  }

  post(
    type: CrossTabMessage['type'],
    resource: OptimisticResource,
    payload: any
  ): void {
    if (!this.isSupported) return;

    const message: CrossTabMessage = {
      type,
      resource,
      payload,
      sourceTabId: CURRENT_TAB_ID,
      timestamp: Date.now(),
    };

    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch {
        // Ignore
      }
    }

    // Storage fallback trigger
    try {
      localStorage.setItem(STORAGE_EVENT_KEY, JSON.stringify(message));
    } catch {
      // Ignore storage write issues
    }
  }

  subscribe(listener: CrossTabListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(message: CrossTabMessage): void {
    this.listeners.forEach((listener) => {
      try {
        listener(message);
      } catch (err) {
        console.error('Error in optimistic cross-tab listener:', err);
      }
    });
  }

  close(): void {
    if (this.channel) {
      try {
        this.channel.close();
      } catch {
        // Ignore
      }
      this.channel = null;
    }
    this.listeners.clear();
  }
}

export const broadcaster = new OptimisticBroadcaster();
