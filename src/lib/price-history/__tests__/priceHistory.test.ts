import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  computePriceTag,
  computeWasPrice,
  MIN_HISTORY_DAYS,
} from '../tagLogic';
import {
  DailyPricePoint,
  PriceHistoryStats,
  PriceRecord,
} from '../types';

describe('Price History Tag Logic & Honesty Rules', () => {
  // Helper to construct daily points
  function makeDailyPoints(
    prices: number[],
    startDate: string = '2026-09-01'
  ): DailyPricePoint[] {
    const start = new Date(startDate);
    return prices.map((price, idx) => {
      const d = new Date(start.getTime() + idx * 86400000);
      return {
        date: d.toISOString().slice(0, 10),
        lowestPrice: price,
        closingPrice: price,
        isPromotion: false,
        recordsCount: 1,
      };
    });
  }

  function makeStats(points: DailyPricePoint[]): PriceHistoryStats {
    const prices = points.map((p) => p.closingPrice);
    const lowest = Math.min(...prices);
    const highest = Math.max(...prices);
    const sum = prices.reduce((a, b) => a + b, 0);
    const current = prices[prices.length - 1];
    const lowestPoint = points.find((p) => p.lowestPrice === lowest);
    const highestPoint = points.find((p) => p.closingPrice === highest);

    return {
      lowest,
      highest,
      current,
      average: Math.round(sum / points.length),
      lowestDate: lowestPoint ? lowestPoint.date : '',
      highestDate: highestPoint ? highestPoint.date : '',
      daysTracked: points.length,
      wasPrice: computeWasPrice(points, current, 7),
    };
  }

  it('1. New product with 10 days of data (< MIN_HISTORY_DAYS = 14) renders no promotional claim', () => {
    // 10 days of data
    const points = makeDailyPoints(Array(10).fill(24900));
    const stats = makeStats(points);
    const tag = computePriceTag(points, stats, points[0].date);

    assert.ok(tag !== null, 'Tag should return neutral tracking started note');
    assert.strictEqual(tag.type, 'tracking_started');
    assert.strictEqual(tag.isNeutral, true);
    assert.ok(tag.text.includes('Price tracking started on'));
    assert.ok(!tag.text.includes('Lowest price'));
  });

  it('2. Missing or empty data renders no claim', () => {
    const stats: PriceHistoryStats = {
      lowest: 0,
      highest: 0,
      current: 0,
      average: 0,
      lowestDate: '',
      highestDate: '',
      daysTracked: 0,
      wasPrice: null,
    };
    const tag = computePriceTag([], stats, '');
    assert.strictEqual(tag, null, 'Empty data must return null');
  });

  it('3. Exactly at minimum (14 days) with a price drop computes truthful tag', () => {
    // 13 days at 25000, 14th day drops to 21000
    const prices = [...Array(13).fill(25000), 21000];
    const points = makeDailyPoints(prices);
    const stats = makeStats(points);
    const tag = computePriceTag(points, stats, points[0].date);

    assert.ok(tag !== null);
    assert.strictEqual(tag.type, 'lowest_in_days');
    assert.strictEqual(tag.text, 'Lowest price in 14 days');
  });

  it('4. Full 30 days tracked with current price at new low -> "Lowest price in 30 days"', () => {
    // 29 days at 25000, 30th day at 22000
    const prices = [...Array(29).fill(25000), 22000];
    const points = makeDailyPoints(prices);
    const stats = makeStats(points);
    const tag = computePriceTag(points, stats, points[0].date);

    assert.ok(tag !== null);
    assert.strictEqual(tag.type, 'lowest_in_days');
    assert.strictEqual(tag.text, 'Lowest price in 30 days');
    assert.strictEqual(tag.highlightPhrase, 'Lowest price in 30 days');
  });

  it('5. Exactly 20 days of data at new low -> "Lowest price in 20 days"', () => {
    // Strict requirement: "If we only have 20 days of data, the tag must say 'Lowest price in 20 days' or not appear at all"
    const prices = [...Array(19).fill(29900), 24900];
    const points = makeDailyPoints(prices);
    const stats = makeStats(points);
    const tag = computePriceTag(points, stats, points[0].date);

    assert.ok(tag !== null);
    assert.strictEqual(tag.type, 'lowest_in_days');
    assert.strictEqual(tag.text, 'Lowest price in 20 days');
  });

  it('6. Tie with 30-day low -> "Same price as 30-day low"', () => {
    // Low of 20000 was set on day 5 and then price went back to 22000, and today returned to 20000
    const prices = [
      ...Array(4).fill(25000),
      20000, // day 5
      ...Array(20).fill(22000),
      ...Array(5).fill(20000), // days 26 to 30 tie with day 5 low
    ];
    const points = makeDailyPoints(prices);
    const stats = makeStats(points);
    const tag = computePriceTag(points, stats, points[0].date);

    assert.ok(tag !== null);
    assert.strictEqual(tag.type, 'same_as_low');
    assert.strictEqual(tag.text, 'Same price as 30-day low');
  });

  it('7. Price dropped ₹X since [date] when dropping from sustained held price', () => {
    // Held at 30000 for 10 days, then dropped to 27000 (3000 paise drop = ₹30)
    // but not a new low overall (e.g. 20 days ago was 25000)
    const prices = [
      ...Array(10).fill(25000),
      ...Array(10).fill(30000), // sustained 10 days
      ...Array(10).fill(27000), // dropped by 3000
    ];
    const points = makeDailyPoints(prices);
    const stats = makeStats(points);
    const tag = computePriceTag(points, stats, points[0].date);

    assert.ok(tag !== null);
    assert.strictEqual(tag.type, 'price_dropped');
    assert.ok(tag.text.includes('Price dropped'));
    assert.strictEqual(tag.diffAmount, 3000);
  });

  it('8. Price increase higher than usual (> 10% above average) -> "Price is higher than usual"', () => {
    // 25 days at 20000, 5 days at 30000 (avg is 21666, 30000 is > 38% higher)
    const prices = [...Array(25).fill(20000), ...Array(5).fill(30000)];
    const points = makeDailyPoints(prices);
    const stats = makeStats(points);
    const tag = computePriceTag(points, stats, points[0].date);

    assert.ok(tag !== null);
    assert.strictEqual(tag.type, 'higher_than_usual');
    assert.strictEqual(tag.text, 'Price is higher than usual');
  });

  it('9. Flat price for 30 days -> "Price has stayed the same for 30 days"', () => {
    const prices = Array(30).fill(24900);
    const points = makeDailyPoints(prices);
    const stats = makeStats(points);
    const tag = computePriceTag(points, stats, points[0].date);

    assert.ok(tag !== null);
    assert.strictEqual(tag.type, 'same_for_days');
    assert.strictEqual(tag.text, 'Price has stayed the same for 30 days');
  });

  it('10. Honest was-price calculation: requires price held for at least 7 days', () => {
    // Price held at 35000 for 8 days, then currently 30000
    const pointsWith7Days = makeDailyPoints([
      ...Array(8).fill(35000),
      ...Array(10).fill(30000),
    ]);
    const wasPrice = computeWasPrice(pointsWith7Days, 30000, 7);
    assert.strictEqual(wasPrice, 35000, 'Was-price should be 35000 because held for >= 7 days');

    // Price held at 35000 for ONLY 4 days (not sustained) -> wasPrice MUST be null
    const pointsWith4Days = makeDailyPoints([
      ...Array(4).fill(35000),
      ...Array(10).fill(30000),
    ]);
    const invalidWasPrice = computeWasPrice(pointsWith4Days, 30000, 7);
    assert.strictEqual(invalidWasPrice, null, 'Must never fabricate was-price for unsustained spikes');
  });

  it('11. No tag qualifies when price fluctuates slightly around mean without meeting criteria', () => {
    // 30 days fluctuating between 24000 and 26000, ending at 25000 (near middle, not low, not high, no 7-day drop)
    const prices = [
      24000, 25000, 26000, 24500, 25500, 24800, 25200, 24100, 25900, 24700,
      25300, 24600, 25400, 24900, 25100, 24400, 25600, 24800, 25200, 24300,
      25700, 24900, 25100, 24600, 25400, 24800, 25200, 24500, 25500, 25000,
    ];
    const points = makeDailyPoints(prices);
    const stats = makeStats(points);
    const tag = computePriceTag(points, stats, points[0].date);

    assert.strictEqual(tag, null, 'Must return null when no claim is provable');
  });

  it('12. Variant-specific price history tracks independently', async () => {
    const { getProductPriceHistory } = await import('../service');
    
    // Product t-1 has base, 'Matte Black', and 'Graphite'
    const blackHistory = getProductPriceHistory('t-1', 'Matte Black', 30);
    const graphiteHistory = getProductPriceHistory('t-1', 'Graphite', 30);

    assert.ok(blackHistory !== null, 'Matte Black history must exist');
    assert.ok(graphiteHistory !== null, 'Graphite history must exist');

    assert.strictEqual(blackHistory.variantId, 'Matte Black');
    assert.strictEqual(graphiteHistory.variantId, 'Graphite');

    // Graphite is premium variant: initial was 26900, current is 23900
    // Matte Black: initial was 24900, current is 21900
    assert.strictEqual(blackHistory.stats.current, 21900);
    assert.strictEqual(graphiteHistory.stats.current, 23900);
  });

  it('13. Manual simulation: altering a test product price over several days updates chart, stats, and tag truthfully', async () => {
    const { recordPriceChange, getProductPriceHistory } = await import('../service');

    const testProductId = `test_prod_${Date.now()}`;
    const baseDate = new Date();

    // 1. Initial price 30 days ago: 50000
    const d1 = new Date(baseDate.getTime() - 30 * 86400000).toISOString();
    recordPriceChange({
      productId: testProductId,
      price: 50000,
      source: 'initial_record',
      recordedAt: d1,
    });

    // 2. Mid period price 15 days ago: 55000 (held for 10 days)
    const d2 = new Date(baseDate.getTime() - 15 * 86400000).toISOString();
    recordPriceChange({
      productId: testProductId,
      price: 55000,
      source: 'catalog_update',
      recordedAt: d2,
    });

    // 3. Today dropped to 42000 (New 30-day low!)
    recordPriceChange({
      productId: testProductId,
      price: 42000,
      source: 'catalog_update',
      recordedAt: baseDate.toISOString(),
    });

    const result = getProductPriceHistory(testProductId, null, 30);
    assert.ok(result !== null);
    assert.strictEqual(result.stats.current, 42000, 'Current price must match latest record');
    assert.strictEqual(result.stats.lowest, 42000, 'Lowest price must be 42000');
    assert.strictEqual(result.stats.highest, 55000, 'Highest price must be 55000');
    assert.ok(result.qualifiesForChart, 'Must qualify for chart (> 14 days tracked)');
    assert.ok(result.tag !== null, 'Tag must exist');
    assert.strictEqual(result.tag.type, 'lowest_in_days');
    assert.strictEqual(result.tag.text, 'Lowest price in 30 days');
  });
});
