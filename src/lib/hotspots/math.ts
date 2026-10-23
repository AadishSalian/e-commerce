import { CalloutPosition, Hotspot, HotspotValidationResult, RenderedMarkerPosition } from './types';

export const MAX_HOTSPOTS_PER_IMAGE = 5;
export const MAX_DESCRIPTION_LENGTH = 120;
export const MIN_DISTANCE_PERCENT = 8.0; // Distance below which markers may overlap on mobile screens
export const MIN_RENDERED_PIXEL_DISTANCE = 26; // Min px distance between markers before nudging

/**
 * Calculates pixel and container-percentage coordinates of a hotspot
 * taking into account CSS object-fit: cover scaling and cropping.
 */
export function calculateCoverCoordinates(
  xPercent: number,
  yPercent: number,
  containerWidth: number,
  containerHeight: number,
  naturalWidth: number,
  naturalHeight: number
): RenderedMarkerPosition {
  if (!containerWidth || !containerHeight || !naturalWidth || !naturalHeight) {
    const xClamped = Math.max(0, Math.min(100, xPercent));
    const yClamped = Math.max(0, Math.min(100, yPercent));
    return {
      xPx: (xClamped / 100) * (containerWidth || 0),
      yPx: (yClamped / 100) * (containerHeight || 0),
      xPercentContainer: xClamped,
      yPercentContainer: yClamped,
      isVisible: true,
    };
  }

  // object-fit: cover scale factor
  const scale = Math.max(containerWidth / naturalWidth, containerHeight / naturalHeight);
  const renderedWidth = naturalWidth * scale;
  const renderedHeight = naturalHeight * scale;

  // Offsets (usually negative or 0) due to centering in container
  const offsetX = (containerWidth - renderedWidth) / 2;
  const offsetY = (containerHeight - renderedHeight) / 2;

  const xPx = offsetX + (xPercent / 100) * renderedWidth;
  const yPx = offsetY + (yPercent / 100) * renderedHeight;

  const xPercentContainer = (xPx / containerWidth) * 100;
  const yPercentContainer = (yPx / containerHeight) * 100;

  // Visible if not cropped outside the visible container box (with 10px margin)
  const isVisible = xPx >= -10 && xPx <= containerWidth + 10 && yPx >= -10 && yPx <= containerHeight + 10;

  return {
    xPx: Math.round(xPx * 10) / 10,
    yPx: Math.round(yPx * 10) / 10,
    xPercentContainer: Math.round(xPercentContainer * 10) / 10,
    yPercentContainer: Math.round(yPercentContainer * 10) / 10,
    isVisible,
  };
}

/**
 * Converts a click/drag coordinate inside a container into the intrinsic image (x, y)%
 * reverse-calculating object-fit: cover.
 */
export function calculateNaturalCoordinatesFromContainer(
  clickXPx: number,
  clickYPx: number,
  containerWidth: number,
  containerHeight: number,
  naturalWidth: number,
  naturalHeight: number
): { x: number; y: number } {
  if (!containerWidth || !containerHeight || !naturalWidth || !naturalHeight) {
    const x = Math.max(0, Math.min(100, Math.round((clickXPx / (containerWidth || 1)) * 1000) / 10));
    const y = Math.max(0, Math.min(100, Math.round((clickYPx / (containerHeight || 1)) * 1000) / 10));
    return { x, y };
  }

  const scale = Math.max(containerWidth / naturalWidth, containerHeight / naturalHeight);
  const renderedWidth = naturalWidth * scale;
  const renderedHeight = naturalHeight * scale;

  const offsetX = (containerWidth - renderedWidth) / 2;
  const offsetY = (containerHeight - renderedHeight) / 2;

  const imgPxX = clickXPx - offsetX;
  const imgPxY = clickYPx - offsetY;

  const naturalX = (imgPxX / renderedWidth) * 100;
  const naturalY = (imgPxY / renderedHeight) * 100;

  return {
    x: Math.max(0, Math.min(100, Math.round(naturalX * 10) / 10)),
    y: Math.max(0, Math.min(100, Math.round(naturalY * 10) / 10)),
  };
}

/**
 * Calculates Euclidean distance between two points in percentage terms.
 */
export function calculateDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

/**
 * Validates a hotspot list for an image:
 * - Max 5 hotspots
 * - Description length <= 120 chars
 * - Warns if any 2 hotspots are within MIN_DISTANCE_PERCENT (< 8%)
 */
export function validateHotspots(hotspots: Hotspot[]): HotspotValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const overlappingPairs: [string, string][] = [];

  if (hotspots.length > MAX_HOTSPOTS_PER_IMAGE) {
    errors.push(`Image has ${hotspots.length} hotspots, exceeding maximum limit of ${MAX_HOTSPOTS_PER_IMAGE}.`);
  }

  hotspots.forEach((h, idx) => {
    if (!h.title || h.title.trim().length === 0) {
      errors.push(`Hotspot #${idx + 1} is missing a title.`);
    }
    if (h.description && h.description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push(`Hotspot "${h.title || idx + 1}" description exceeds ${MAX_DESCRIPTION_LENGTH} characters (${h.description.length}).`);
    }
    if (h.x < 0 || h.x > 100 || h.y < 0 || h.y > 100) {
      errors.push(`Hotspot "${h.title || idx + 1}" coordinates must be within 0-100%.`);
    }
  });

  // Check proximity between any pair
  for (let i = 0; i < hotspots.length; i++) {
    for (let j = i + 1; j < hotspots.length; j++) {
      const h1 = hotspots[i];
      const h2 = hotspots[j];
      const dist = calculateDistance(h1, h2);
      if (dist < MIN_DISTANCE_PERCENT) {
        overlappingPairs.push([h1.id, h2.id]);
        warnings.push(
          `Hotspots "${h1.title || '#' + h1.order}" and "${h2.title || '#' + h2.order}" are only ${dist.toFixed(1)}% apart and may overlap on mobile screens.`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    overlappingPairs,
  };
}

/**
 * Nudges lower-priority overlapping markers at render time so they do not collide.
 */
export function resolveMarkerCollisions(
  markers: Array<{ id: string; order: number; pos: RenderedMarkerPosition }>
): Map<string, { xPx: number; yPx: number }> {
  const resolved = new Map<string, { xPx: number; yPx: number }>();

  // Sort by order ascending (highest priority first)
  const sorted = [...markers].sort((a, b) => a.order - b.order);

  sorted.forEach((item) => {
    let curX = item.pos.xPx;
    let curY = item.pos.yPx;

    // Check collision against already positioned higher-priority markers
    for (const [otherId, otherPos] of resolved.entries()) {
      const dist = Math.hypot(curX - otherPos.xPx, curY - otherPos.yPx);
      if (dist < MIN_RENDERED_PIXEL_DISTANCE) {
        // Nudge diagonally or horizontally by 16px
        const angle = Math.atan2(curY - otherPos.yPx, curX - otherPos.xPx) || (Math.PI / 4);
        const nudgeDist = MIN_RENDERED_PIXEL_DISTANCE - dist + 2;
        curX += Math.cos(angle) * nudgeDist;
        curY += Math.sin(angle) * nudgeDist;
      }
    }

    resolved.set(item.id, { xPx: Math.round(curX * 10) / 10, yPx: Math.round(curY * 10) / 10 });
  });

  return resolved;
}

/**
 * Computes smart placement for a callout card anchored to a marker.
 * Flips top/bottom and shifts left/right to ensure it never overflows the container or screen.
 */
export function computeSmartCalloutPosition({
  markerXPx,
  markerYPx,
  containerWidth,
  containerHeight,
  cardWidth = 280,
  cardHeight = 140,
  isRtl = false,
  isMobile = false,
}: {
  markerXPx: number;
  markerYPx: number;
  containerWidth: number;
  containerHeight: number;
  cardWidth?: number;
  cardHeight?: number;
  isRtl?: boolean;
  isMobile?: boolean;
}): CalloutPosition {
  if (isMobile) {
    return {
      side: 'bottom',
      alignment: 'center',
      arrowOffsetPx: 0,
      isMobileSheet: true,
    };
  }

  // Margin from container edges
  const edgeMargin = 12;

  // Decide vertical placement (flip above if in lower part or insufficient space below)
  const spaceBelow = containerHeight - markerYPx;
  const spaceAbove = markerYPx;
  const side: 'top' | 'bottom' = spaceAbove > cardHeight + 20 && (spaceBelow < cardHeight + 40 || markerYPx > containerHeight * 0.45)
    ? 'top'
    : 'bottom';

  // Decide horizontal alignment
  // Ideal is to center the card on the marker
  let left = markerXPx - cardWidth / 2;
  const minLeft = edgeMargin;
  const maxLeft = containerWidth - cardWidth - edgeMargin;

  // Clamp left
  left = Math.max(minLeft, Math.min(maxLeft, left));

  // If RTL, compute right instead
  const right = isRtl ? containerWidth - (left + cardWidth) : undefined;

  // Arrow offset is relative to the card's left edge
  let arrowOffsetPx = markerXPx - left;
  arrowOffsetPx = Math.max(16, Math.min(cardWidth - 16, arrowOffsetPx));

  const position: CalloutPosition = {
    side,
    alignment: 'center',
    arrowOffsetPx: Math.round(arrowOffsetPx),
    isMobileSheet: false,
  };

  if (side === 'top') {
    position.bottom = Math.round(containerHeight - markerYPx + 14);
  } else {
    position.top = Math.round(markerYPx + 14);
  }

  if (isRtl && right !== undefined) {
    position.right = Math.round(right);
  } else {
    position.left = Math.round(left);
  }

  return position;
}
