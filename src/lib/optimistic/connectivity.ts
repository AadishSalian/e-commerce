/**
 * Real Connectivity Detection
 * Detects actual network reachability beyond navigator.onLine by performing
 * lightweight probes to /api/health with timeout controls.
 * Adheres to Section 7:
 * - Detect real connectivity (not navigator.onLine alone)
 * - Quiet status ("Offline. Changes will sync when you're back")
 * - Automatic reconnection triggering outbox replay
 */

export type ConnectivityListener = (isOnline: boolean) => void;

class RealConnectivityDetector {
  private isOnlineState: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<ConnectivityListener> = new Set();
  private isChecking = false;
  private lastProbeTime = 0;
  private readonly PROBE_CACHE_MS = 2500; // Do not spam health check within 2.5s
  private readonly PROBE_TIMEOUT_MS = 3000;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkEvent(true));
      window.addEventListener('offline', () => this.handleNetworkEvent(false));

      // Check real connectivity on window focus / tab resume
      window.addEventListener('focus', () => this.checkRealConnectivity());

      // Initial check if window is already loaded
      this.checkRealConnectivity();
    }
  }

  get isOnline(): boolean {
    return this.isOnlineState;
  }

  private handleNetworkEvent(browserOnline: boolean): void {
    if (!browserOnline) {
      this.updateState(false);
      return;
    }
    // If browser claims online, verify actual connectivity with a probe
    this.checkRealConnectivity();
  }

  /**
   * Performs an actual network probe to /api/health to verify connectivity
   */
  async checkRealConnectivity(force = false): Promise<boolean> {
    if (typeof window === 'undefined') return true;

    // If navigator says offline, it's definitely offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.updateState(false);
      return false;
    }

    const now = Date.now();
    if (!force && now - this.lastProbeTime < this.PROBE_CACHE_MS) {
      return this.isOnlineState;
    }

    if (this.isChecking) return this.isOnlineState;
    this.isChecking = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.PROBE_TIMEOUT_MS);

    try {
      this.lastProbeTime = now;
      const res = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      }).catch(async () => {
        // Fallback to GET if HEAD isn't permitted by route
        return await fetch('/api/health', {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });
      });

      clearTimeout(timeoutId);
      const isReachable = res.ok || res.status < 500;
      this.updateState(isReachable);
      return isReachable;
    } catch {
      clearTimeout(timeoutId);
      this.updateState(false);
      return false;
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Called when an API fetch throws a TypeError / network failure
   */
  reportNetworkError(): void {
    this.checkRealConnectivity(true);
  }

  private updateState(newState: boolean): void {
    if (this.isOnlineState !== newState) {
      this.isOnlineState = newState;
      this.listeners.forEach((listener) => {
        try {
          listener(newState);
        } catch (err) {
          console.error('Error in connectivity listener:', err);
        }
      });
    }
  }

  subscribe(listener: ConnectivityListener): () => void {
    this.listeners.add(listener);
    // Fire immediately with current known state
    listener(this.isOnlineState);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const connectivity = new RealConnectivityDetector();
