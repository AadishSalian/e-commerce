import { EngravingZone } from './types';
import { SEED_ENGRAVING_ZONES } from './data';

const STORAGE_KEY = 'matte_engraving_zones_v1';

/**
 * Service to load, store, and look up product personalization zones
 */
export class PersonalizationService {
  private static memoryZones: Map<string, EngravingZone> = new Map(
    SEED_ENGRAVING_ZONES.map((zone) => [zone.zone_id, zone])
  );

  /**
   * Get all available engraving zones (synchronous fallback)
   */
  public static getAllZones(): EngravingZone[] {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as EngravingZone[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // Fall back to memory
      }
    }
    return Array.from(this.memoryZones.values());
  }

  /**
   * Get zones for a specific product
   */
  public static getZonesForProduct(productId: string): EngravingZone[] {
    const all = this.getAllZones();
    return all.filter((z) => z.productId === productId);
  }

  /**
   * Find zone by ID
   */
  public static getZoneById(zoneId: string): EngravingZone | null {
    const all = this.getAllZones();
    return all.find((z) => z.zone_id === zoneId) || null;
  }

  /**
   * Save or update a zone (used by Admin Authoring Studio)
   */
  public static saveZone(zone: EngravingZone): void {
    const zones = this.getAllZones();
    const existingIndex = zones.findIndex((z) => z.zone_id === zone.zone_id);

    if (existingIndex >= 0) {
      zones[existingIndex] = zone;
    } else {
      zones.push(zone);
    }

    this.memoryZones.set(zone.zone_id, zone);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(zones));
      } catch (err) {
        console.error('Failed to persist zone to localStorage', err);
      }
    }
  }

  /**
   * Delete a zone
   */
  public static deleteZone(zoneId: string): void {
    const zones = this.getAllZones().filter((z) => z.zone_id !== zoneId);
    this.memoryZones.delete(zoneId);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(zones));
      } catch (err) {
        console.error('Failed to remove zone from localStorage', err);
      }
    }
  }

  /**
   * Reset to catalog seed zones
   */
  public static resetToSeeds(): void {
    this.memoryZones = new Map(SEED_ENGRAVING_ZONES.map((zone) => [zone.zone_id, zone]));
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
  }
}
