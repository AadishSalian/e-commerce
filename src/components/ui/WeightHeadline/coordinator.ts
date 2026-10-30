/**
 * Viewport Coordinator for WeightHeadline instances.
 * Enforces the rule: "A maximum of one active instance per viewport.
 * Multiple headlines in view: only the one closest to the pointer reacts,
 * or the second is disabled, to respect the one-per-viewport rule."
 */

import { BoundingRect, distanceToRect } from './tokens';

export interface HeadlineInstance {
  id: string;
  getRect: () => BoundingRect | null;
  setActive: (active: boolean) => void;
  inView: boolean;
}

class ViewportCoordinator {
  private instances = new Map<string, HeadlineInstance>();
  private activeId: string | null = null;

  /**
   * Register a WeightHeadline instance.
   */
  public register(instance: HeadlineInstance): () => void {
    this.instances.set(instance.id, instance);
    return () => {
      this.unregister(instance.id);
    };
  }

  /**
   * Unregister an instance on unmount.
   */
  public unregister(id: string): void {
    this.instances.delete(id);
    if (this.activeId === id) {
      this.activeId = null;
    }
  }

  /**
   * Update whether a headline is currently visible within the viewport.
   */
  public setInView(id: string, inView: boolean): void {
    const instance = this.instances.get(id);
    if (!instance) return;
    instance.inView = inView;

    if (!inView && this.activeId === id) {
      instance.setActive(false);
      this.activeId = null;
    }
  }

  /**
   * Evaluate which headline is closest to the pointer coordinates (clientX, clientY)
   * among those currently in view, and grant active status only to that single instance.
   */
  public updateActiveHeadline(pointerX: number, pointerY: number): string | null {
    const visibleInstances: { id: string; distance: number; instance: HeadlineInstance }[] = [];

    for (const [, instance] of this.instances) {
      if (!instance.inView) continue;

      const rect = instance.getRect();
      if (!rect) continue;

      const distance = distanceToRect(pointerX, pointerY, rect);
      visibleInstances.push({ id: instance.id, distance, instance });
    }

    if (visibleInstances.length === 0) {
      this.activeId = null;
      return null;
    }

    if (visibleInstances.length === 1) {
      const sole = visibleInstances[0];
      if (this.activeId !== sole.id) {
        this.activeId = sole.id;
        sole.instance.setActive(true);
      }
      return sole.id;
    }

    // Sort by distance to pointer (closest first)
    visibleInstances.sort((a, b) => a.distance - b.distance);
    const closest = visibleInstances[0];

    // Activate the closest, deactivate all others
    for (const item of visibleInstances) {
      const shouldBeActive = item.id === closest.id;
      item.instance.setActive(shouldBeActive);
    }

    this.activeId = closest.id;
    return closest.id;
  }

  /**
   * Reset all instances to inactive (e.g. pointer leaves window or section).
   */
  public resetAll(): void {
    for (const [, instance] of this.instances) {
      instance.setActive(false);
    }
    this.activeId = null;
  }

  /**
   * Inspect current registered instances (used for testing and debugging).
   */
  public getRegisteredCount(): number {
    return this.instances.size;
  }

  public getActiveId(): string | null {
    return this.activeId;
  }
}

// Global coordinator singleton
export const coordinator = new ViewportCoordinator();
