import { DailyPricePoint, PromotionPeriod } from './types';

export interface Point2D {
  x: number;
  y: number;
  date: string;
  price: number;
  isPromotion: boolean;
}

export interface SparklinePathResult {
  path: string;
  currentPoint: { x: number; y: number; price: number };
  lowestPoint: { x: number; y: number; price: number } | null;
  isFlat: boolean;
}

export interface StepChartPathResult {
  linePath: string;
  areaPath: string;
  points: Point2D[];
  yMin: number;
  yMax: number;
  yRange: number;
  promotionBands: Array<{
    x: number;
    width: number;
    name?: string;
  }>;
}

/**
 * Builds the inline sparkline SVG path.
 * If variation is tiny (< 1.5% of price), renders a flat line to avoid deceiving cliffs.
 */
export function generateSparklinePath(
  points: DailyPricePoint[],
  width: number = 100,
  height: number = 28,
  padding: { top: number; bottom: number; left: number; right: number } = {
    top: 4,
    bottom: 4,
    left: 2,
    right: 4,
  }
): SparklinePathResult | null {
  if (!points || points.length === 0) return null;

  const prices = points.map((p) => p.closingPrice);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // If variation is < 1.5% of the average price, render a flat line
  const isFlat = max - min < avg * 0.015;

  const n = points.length;
  const stepX = n > 1 ? innerWidth / (n - 1) : 0;

  let lowestPoint: { x: number; y: number; price: number } | null = null;
  let lowestVal = Infinity;

  const coords: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < n; i++) {
    const x = padding.left + i * stepX;
    let y: number;

    if (isFlat) {
      y = padding.top + innerHeight / 2;
    } else {
      // Normal scaling: invert y since SVG y=0 is top
      const ratio = (prices[i] - min) / (max - min);
      y = padding.top + (1 - ratio) * innerHeight;
    }

    coords.push({ x, y });

    if (prices[i] < lowestVal) {
      lowestVal = prices[i];
      lowestPoint = { x, y, price: lowestVal };
    }
  }

  // Build path
  const pathParts: string[] = [];
  coords.forEach((c, idx) => {
    if (idx === 0) {
      pathParts.push(`M ${c.x.toFixed(1)},${c.y.toFixed(1)}`);
    } else {
      pathParts.push(`L ${c.x.toFixed(1)},${c.y.toFixed(1)}`);
    }
  });

  const currentCoord = coords[coords.length - 1];

  // Don't show hollow lowest dot if it's the current point or flat
  if (isFlat || (lowestPoint && Math.abs(lowestPoint.x - currentCoord.x) < 4)) {
    lowestPoint = null;
  }

  return {
    path: pathParts.join(' '),
    currentPoint: {
      x: currentCoord.x,
      y: currentCoord.y,
      price: prices[prices.length - 1],
    },
    lowestPoint,
    isFlat,
  };
}

/**
 * Builds the stepped line and area paths for the detail view chart.
 * Prices change abruptly and stay flat between changes, representing real price behavior.
 */
export function generateStepChartPath(
  points: DailyPricePoint[],
  width: number,
  height: number,
  promotionPeriods: PromotionPeriod[] = [],
  padding: { top: number; bottom: number; left: number; right: number } = {
    top: 24,
    bottom: 32,
    left: 48,
    right: 20,
  }
): StepChartPathResult | null {
  if (!points || points.length === 0) return null;

  const prices = points.map((p) => p.closingPrice);
  const dataMin = Math.min(...prices);
  const dataMax = Math.max(...prices);

  // Give y-axis a 5% margin above and below so line doesn't collide with borders
  const delta = dataMax - dataMin;
  const margin = delta === 0 ? dataMin * 0.05 : delta * 0.08;
  const yMin = Math.max(0, Math.floor(dataMin - margin));
  const yMax = Math.ceil(dataMax + margin);
  const yRange = yMax - yMin || 1;

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const n = points.length;
  const stepX = n > 1 ? innerWidth / (n - 1) : 0;

  const pointList: Point2D[] = [];
  const lineParts: string[] = [];

  for (let i = 0; i < n; i++) {
    const x = padding.left + i * stepX;
    const ratio = (prices[i] - yMin) / yRange;
    const y = padding.top + (1 - ratio) * innerHeight;

    pointList.push({
      x,
      y,
      date: points[i].date,
      price: prices[i],
      isPromotion: points[i].isPromotion,
    });

    if (i === 0) {
      lineParts.push(`M ${x.toFixed(1)},${y.toFixed(1)}`);
    } else {
      // Step line: horizontal across to next x, then vertical to next y
      const prevY = pointList[i - 1].y;
      lineParts.push(`H ${x.toFixed(1)}`);
      lineParts.push(`V ${y.toFixed(1)}`);
    }
  }

  const linePath = lineParts.join(' ');

  // Area path: closes down to bottom axis
  const bottomY = padding.top + innerHeight;
  const firstX = pointList[0].x;
  const lastX = pointList[pointList.length - 1].x;
  const areaPath = `${linePath} V ${bottomY.toFixed(1)} H ${firstX.toFixed(1)} Z`;

  // Map promotion periods to x coordinates
  const promotionBands: Array<{ x: number; width: number; name?: string }> = [];
  const dateToIndex = new Map<string, number>();
  points.forEach((p, idx) => dateToIndex.set(p.date, idx));

  for (const promo of promotionPeriods) {
    // Find closest or matching dates
    let startIdx = 0;
    let endIdx = n - 1;

    for (let i = 0; i < n; i++) {
      if (points[i].date >= promo.startDate) {
        startIdx = i;
        break;
      }
    }
    for (let i = n - 1; i >= 0; i--) {
      if (points[i].date <= promo.endDate) {
        endIdx = i;
        break;
      }
    }

    if (endIdx >= startIdx) {
      const bandX = padding.left + startIdx * stepX;
      const bandWidth = Math.max(stepX, (endIdx - startIdx) * stepX);
      promotionBands.push({
        x: bandX,
        width: bandWidth,
        name: promo.name || 'Promotion',
      });
    }
  }

  return {
    linePath,
    areaPath,
    points: pointList,
    yMin,
    yMax,
    yRange,
    promotionBands,
  };
}
