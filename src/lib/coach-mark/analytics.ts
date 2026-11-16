import { TourAnalyticsEvent } from './types';

type AnalyticsSubscriber = (event: TourAnalyticsEvent) => void;

const subscribers: Set<AnalyticsSubscriber> = new Set();

/**
 * Registers an analytics listener for tour events.
 * Returns an unregister function.
 */
export function addTourAnalyticsSubscriber(callback: AnalyticsSubscriber): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Dispatches an analytics event to all registered listeners and dispatches a DOM event.
 * No personal identifying information (PII) is included.
 */
export function dispatchTourAnalytics(event: TourAnalyticsEvent): void {
  subscribers.forEach((sub) => {
    try {
      sub(event);
    } catch (err) {
      console.warn('[CoachMark] Analytics subscriber error:', err);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('matte-tour-analytics', {
        detail: event,
      })
    );
  }
}
