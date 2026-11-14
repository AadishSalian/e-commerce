/**
 * Screen Reader Live Region Announcer
 * Provides debounced, polite announcements for low-risk optimistic outcomes
 * and assertive announcements for blocking errors, adhering to Section 10 Accessibility rules.
 */

type AnnouncementPriority = 'polite' | 'assertive';

interface AnnouncementQueueItem {
  message: string;
  priority: AnnouncementPriority;
  timestamp: number;
}

class LiveRegionAnnouncer {
  private politeElement: HTMLElement | null = null;
  private assertiveElement: HTMLElement | null = null;
  private debounceTimer: any = null;
  private lastAnnouncedMessage: string | null = null;
  private pendingMessage: string | null = null;
  private readonly DEBOUNCE_MS = 350;

  private ensureElements(): void {
    if (typeof document === 'undefined') return;

    if (!this.politeElement) {
      let el = document.getElementById('optimistic-live-region-polite');
      if (!el) {
        el = document.createElement('div');
        el.id = 'optimistic-live-region-polite';
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-atomic', 'true');
        el.className = 'sr-only';
        el.style.cssText =
          'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
        document.body.appendChild(el);
      }
      this.politeElement = el;
    }

    if (!this.assertiveElement) {
      let el = document.getElementById('optimistic-live-region-assertive');
      if (!el) {
        el = document.createElement('div');
        el.id = 'optimistic-live-region-assertive';
        el.setAttribute('aria-live', 'assertive');
        el.setAttribute('aria-atomic', 'true');
        el.className = 'sr-only';
        el.style.cssText =
          'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
        document.body.appendChild(el);
      }
      this.assertiveElement = el;
    }
  }

  announce(message: string, priority: AnnouncementPriority = 'polite'): void {
    if (!message || typeof window === 'undefined') return;
    this.ensureElements();

    if (priority === 'assertive') {
      if (this.assertiveElement) {
        this.assertiveElement.textContent = '';
        setTimeout(() => {
          if (this.assertiveElement) this.assertiveElement.textContent = message;
        }, 50);
      }
      return;
    }

    // Debounce polite announcements to prevent spamming during rapid bursts of taps
    this.pendingMessage = message;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      if (this.pendingMessage && this.politeElement) {
        this.politeElement.textContent = '';
        const msg = this.pendingMessage;
        this.pendingMessage = null;
        setTimeout(() => {
          if (this.politeElement) {
            this.politeElement.textContent = msg;
            this.lastAnnouncedMessage = msg;
          }
        }, 50);
      }
    }, this.DEBOUNCE_MS);
  }

  getLastAnnouncement(): string | null {
    return this.lastAnnouncedMessage;
  }
}

export const announcer = new LiveRegionAnnouncer();
