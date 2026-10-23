import fs from 'fs';
import path from 'path';
import { Hotspot } from './types';
import { SEED_HOTSPOTS } from './data';
import { validateHotspots } from './math';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'hotspots.json');

let cachedHotspots: Hotspot[] | null = null;

function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_HOTSPOTS, null, 2), 'utf-8');
    cachedHotspots = [...SEED_HOTSPOTS];
  }
}

/**
 * Loads all hotspots from file or in-memory cache
 */
export function getAllHotspots(): Hotspot[] {
  if (cachedHotspots) {
    return cachedHotspots;
  }
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    cachedHotspots = JSON.parse(raw);
    return cachedHotspots || [];
  } catch (error) {
    console.error('Failed to read hotspots data:', error);
    return SEED_HOTSPOTS;
  }
}

/**
 * Saves all hotspots to file and updates cache
 */
export function saveAllHotspots(hotspots: Hotspot[]): void {
  ensureDataFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(hotspots, null, 2), 'utf-8');
    cachedHotspots = hotspots;
  } catch (error) {
    console.error('Failed to save hotspots data:', error);
    throw error;
  }
}

/**
 * Gets hotspots for a specific product, filtered by variant if specified
 */
export function getHotspotsForProduct(productId: string, variantId?: string | null): Hotspot[] {
  const all = getAllHotspots();
  return all
    .filter((h) => h.productId === productId)
    .filter((h) => {
      if (!variantId) return true;
      if (!h.variantIds || h.variantIds.length === 0) return true;
      return h.variantIds.includes(variantId);
    })
    .sort((a, b) => a.order - b.order);
}

/**
 * Gets hotspots for a specific image, filtered by variant if specified
 */
export function getHotspotsForImage(imageId: string, variantId?: string | null): Hotspot[] {
  const all = getAllHotspots();
  return all
    .filter((h) => h.imageId === imageId)
    .filter((h) => {
      if (!variantId) return true;
      if (!h.variantIds || h.variantIds.length === 0) return true;
      return h.variantIds.includes(variantId);
    })
    .sort((a, b) => a.order - b.order);
}

/**
 * Replaces or updates the list of hotspots for a given image
 */
export function saveHotspotsForImage(
  imageId: string,
  productId: string,
  newHotspots: Hotspot[]
): { success: boolean; validation: ReturnType<typeof validateHotspots>; hotspots: Hotspot[] } {
  const validation = validateHotspots(newHotspots);
  if (!validation.isValid) {
    return { success: false, validation, hotspots: newHotspots };
  }

  const all = getAllHotspots();
  // Filter out existing hotspots for this image
  const others = all.filter((h) => h.imageId !== imageId);

  // Ensure timestamps and ordering
  const now = new Date().toISOString();
  const prepared: Hotspot[] = newHotspots.map((h, idx) => ({
    ...h,
    id: h.id || `hs-${Date.now()}-${idx}`,
    productId: productId || h.productId,
    imageId,
    order: h.order || idx + 1,
    createdAt: h.createdAt || now,
    updatedAt: now,
  }));

  const updatedAll = [...others, ...prepared];
  saveAllHotspots(updatedAll);

  return { success: true, validation, hotspots: prepared };
}

/**
 * Deletes a hotspot by id
 */
export function deleteHotspot(id: string): boolean {
  const all = getAllHotspots();
  const next = all.filter((h) => h.id !== id);
  if (next.length !== all.length) {
    saveAllHotspots(next);
    return true;
  }
  return false;
}
