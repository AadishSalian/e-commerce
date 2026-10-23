import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateCoverCoordinates,
  calculateNaturalCoordinatesFromContainer,
  calculateDistance,
  validateHotspots,
  resolveMarkerCollisions,
  computeSmartCalloutPosition,
  MAX_HOTSPOTS_PER_IMAGE,
  MAX_DESCRIPTION_LENGTH,
  MIN_DISTANCE_PERCENT,
  MIN_RENDERED_PIXEL_DISTANCE,
} from '../math';
import { Hotspot } from '../types';
import {
  getAllHotspots,
  getHotspotsForProduct,
  getHotspotsForImage,
  saveHotspotsForImage,
  deleteHotspot,
} from '../service';

describe('Hotspots Math & Coordinate Transforms', () => {
  it('correctly calculates object-fit: cover coordinates when container matches image aspect ratio', () => {
    // 800x800 image in 400x400 container (1:1 ratio)
    const res = calculateCoverCoordinates(50, 50, 400, 400, 800, 800);
    assert.strictEqual(res.xPx, 200);
    assert.strictEqual(res.yPx, 200);
    assert.strictEqual(res.xPercentContainer, 50);
    assert.strictEqual(res.yPercentContainer, 50);
    assert.strictEqual(res.isVisible, true);
  });

  it('correctly calculates object-fit: cover coordinates when image is cropped horizontally', () => {
    // Wide image 1600x800 (2:1) in square container 400x400 (1:1)
    // Scale = max(400/1600, 400/800) = max(0.25, 0.5) = 0.5
    // Rendered size = 800x400.
    // offsetX = (400 - 800) / 2 = -200px. offsetY = (400 - 400) / 2 = 0px.
    // Center point (50%, 50%):
    // xPx = -200 + 0.5 * 800 = 200px (which is 50% of container)
    const centerRes = calculateCoverCoordinates(50, 50, 400, 400, 1600, 800);
    assert.strictEqual(centerRes.xPx, 200);
    assert.strictEqual(centerRes.xPercentContainer, 50);

    // Left point (10%, 50%):
    // xPx = -200 + 0.1 * 800 = -120px (cropped outside left)
    const leftRes = calculateCoverCoordinates(10, 50, 400, 400, 1600, 800);
    assert.strictEqual(leftRes.xPx, -120);
    assert.strictEqual(leftRes.isVisible, false);

    // Visible point (30%, 50%):
    // xPx = -200 + 0.3 * 800 = 40px
    const visibleRes = calculateCoverCoordinates(30, 50, 400, 400, 1600, 800);
    assert.strictEqual(visibleRes.xPx, 40);
    assert.strictEqual(visibleRes.xPercentContainer, 10);
    assert.strictEqual(visibleRes.isVisible, true);
  });

  it('correctly reverses click coordinates back to intrinsic natural image %', () => {
    // Wide image 1600x800 in 400x400 container
    // Click at center (200px, 200px) should return (50%, 50%)
    const naturalCenter = calculateNaturalCoordinatesFromContainer(200, 200, 400, 400, 1600, 800);
    assert.strictEqual(naturalCenter.x, 50);
    assert.strictEqual(naturalCenter.y, 50);

    // Click at left edge 40px should return 30%
    const naturalLeft = calculateNaturalCoordinatesFromContainer(40, 200, 400, 400, 1600, 800);
    assert.strictEqual(naturalLeft.x, 30);
    assert.strictEqual(naturalLeft.y, 50);
  });

  it('calculates distance between points accurately', () => {
    const p1 = { x: 20, y: 30 };
    const p2 = { x: 23, y: 34 };
    // sqrt((23-20)^2 + (34-30)^2) = sqrt(9 + 16) = 5
    const dist = calculateDistance(p1, p2);
    assert.strictEqual(dist, 5);
  });
});

describe('Hotspot Validation & Constraint Rules', () => {
  it('validates successfully when under limits and well-spaced', () => {
    const validHotspots: Hotspot[] = [
      {
        id: 'h1',
        productId: 'p1',
        imageId: 'img1',
        x: 20,
        y: 20,
        title: 'Detail 1',
        description: 'Short valid copy under 120 chars.',
        order: 1,
      },
      {
        id: 'h2',
        productId: 'p1',
        imageId: 'img1',
        x: 60,
        y: 70,
        title: 'Detail 2',
        description: 'Second valid detail copy.',
        order: 2,
      },
    ];

    const res = validateHotspots(validHotspots);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.errors.length, 0);
    assert.strictEqual(res.warnings.length, 0);
  });

  it('enforces maximum 5 hotspots per image limit', () => {
    const sixHotspots: Hotspot[] = Array.from({ length: 6 }).map((_, i) => ({
      id: `h-${i}`,
      productId: 'p1',
      imageId: 'img1',
      x: i * 15,
      y: i * 15,
      title: `Detail ${i + 1}`,
      description: 'Valid short text',
      order: i + 1,
    }));

    const res = validateHotspots(sixHotspots);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some((e) => e.includes(`exceeding maximum limit of ${MAX_HOTSPOTS_PER_IMAGE}`)));
  });

  it('enforces 120 character hard limit on description copy', () => {
    const longDesc = 'A'.repeat(121);
    const hotspots: Hotspot[] = [
      {
        id: 'h1',
        productId: 'p1',
        imageId: 'img1',
        x: 20,
        y: 20,
        title: 'Long copy test',
        description: longDesc,
        order: 1,
      },
    ];

    const res = validateHotspots(hotspots);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some((e) => e.includes(`exceeds ${MAX_DESCRIPTION_LENGTH} characters`)));
  });

  it('detects and warns when markers are closer than MIN_DISTANCE_PERCENT (< 8%)', () => {
    const closeHotspots: Hotspot[] = [
      {
        id: 'h1',
        productId: 'p1',
        imageId: 'img1',
        x: 40,
        y: 50,
        title: 'Marker 1',
        description: 'Valid copy',
        order: 1,
      },
      {
        id: 'h2',
        productId: 'p1',
        imageId: 'img1',
        x: 43,
        y: 53, // distance is sqrt(9 + 9) = 4.24 < 8%
        title: 'Marker 2',
        description: 'Valid copy',
        order: 2,
      },
    ];

    const res = validateHotspots(closeHotspots);
    assert.strictEqual(res.isValid, true); // It is a warning, not a fatal blocking error
    assert.strictEqual(res.warnings.length, 1);
    assert.ok(res.warnings[0].includes('may overlap on mobile screens'));
    assert.strictEqual(res.overlappingPairs?.length, 1);
  });

  it('nudges overlapping rendered markers at render time to avoid visual occlusion', () => {
    const markers = [
      {
        id: 'h1',
        order: 1,
        pos: { xPx: 100, yPx: 100, xPercentContainer: 25, yPercentContainer: 25, isVisible: true },
      },
      {
        id: 'h2',
        order: 2,
        pos: { xPx: 105, yPx: 105, xPercentContainer: 26, yPercentContainer: 26, isVisible: true },
      },
    ];

    const resolved = resolveMarkerCollisions(markers);
    const p1 = resolved.get('h1')!;
    const p2 = resolved.get('h2')!;

    // Higher priority marker (h1, order 1) keeps exact position
    assert.strictEqual(p1.xPx, 100);
    assert.strictEqual(p1.yPx, 100);

    // Lower priority marker (h2, order 2) is nudged away
    const newDist = Math.hypot(p2.xPx - p1.xPx, p2.yPx - p1.yPx);
    assert.ok(newDist >= MIN_RENDERED_PIXEL_DISTANCE, `Expected new distance >= 26px, got ${newDist}`);
  });
});

describe('Smart Callout Positioning', () => {
  it('places callout below marker when marker is in top half of image', () => {
    const pos = computeSmartCalloutPosition({
      markerXPx: 200,
      markerYPx: 80,
      containerWidth: 500,
      containerHeight: 600,
      cardWidth: 280,
      cardHeight: 140,
    });

    assert.strictEqual(pos.side, 'bottom');
    assert.strictEqual(pos.top, 94); // 80 + 14px
    assert.strictEqual(pos.isMobileSheet, false);
    assert.strictEqual(pos.left, 60); // 200 - 140 = 60
  });

  it('flips callout above marker when marker is in lower portion', () => {
    const pos = computeSmartCalloutPosition({
      markerXPx: 200,
      markerYPx: 450,
      containerWidth: 500,
      containerHeight: 600,
      cardWidth: 280,
      cardHeight: 140,
    });

    assert.strictEqual(pos.side, 'top');
    assert.strictEqual(pos.bottom, 164); // 600 - 450 + 14 = 164
  });

  it('clamps card left position so it never overflows left or right edge', () => {
    // Marker near left edge (x = 30px)
    const leftPos = computeSmartCalloutPosition({
      markerXPx: 30,
      markerYPx: 200,
      containerWidth: 500,
      containerHeight: 600,
      cardWidth: 280,
      cardHeight: 140,
    });
    assert.strictEqual(leftPos.left, 12); // clamped to min edge margin 12px
    assert.strictEqual(leftPos.arrowOffsetPx, 18); // pointer stays aimed at 30px (30 - 12 = 18)

    // Marker near right edge (x = 480px)
    const rightPos = computeSmartCalloutPosition({
      markerXPx: 480,
      markerYPx: 200,
      containerWidth: 500,
      containerHeight: 600,
      cardWidth: 280,
      cardHeight: 140,
    });
    // Max left = 500 - 280 - 12 = 208px
    assert.strictEqual(rightPos.left, 208);
    // Pointer clamped inside card bounds
    assert.strictEqual(rightPos.arrowOffsetPx, 264); // cardWidth - 16 = 264
  });

  it('selects mobile bottom sheet mode when isMobile is true', () => {
    const pos = computeSmartCalloutPosition({
      markerXPx: 200,
      markerYPx: 200,
      containerWidth: 360,
      containerHeight: 360,
      isMobile: true,
    });

    assert.strictEqual(pos.isMobileSheet, true);
  });
});

describe('Hotspot Service & Variant Awareness', () => {
  it('loads seed hotspots from file or cache', () => {
    const all = getAllHotspots();
    assert.ok(Array.isArray(all));
    assert.ok(all.length >= 4);
    assert.ok(all.some((h) => h.productId === 't-1'));
  });

  it('filters hotspots by productId', () => {
    const keyboardHotspots = getHotspotsForProduct('t-1');
    assert.ok(keyboardHotspots.length >= 3);
    keyboardHotspots.forEach((h) => assert.strictEqual(h.productId, 't-1'));
  });

  it('filters hotspots by imageId', () => {
    const imgUrl = 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=800&auto=format&fit=crop';
    const hotspots = getHotspotsForImage(imgUrl);
    assert.ok(hotspots.length >= 3);
    hotspots.forEach((h) => assert.strictEqual(h.imageId, imgUrl));
  });

  it('respects variant targeting: universal hotspots show for any variant, variant-specific hotspots filter properly', () => {
    const testHotspots: Hotspot[] = [
      {
        id: 'hs-v-all',
        productId: 'test-p',
        imageId: 'img-test',
        x: 10,
        y: 10,
        title: 'Universal Feature',
        description: 'Shows on all finishes',
        order: 1,
        // variantIds omitted / empty
      },
      {
        id: 'hs-v-black',
        productId: 'test-p',
        imageId: 'img-test',
        x: 20,
        y: 20,
        title: 'Black Anodized Coat',
        description: 'Matte black only finish',
        order: 2,
        variantIds: ['v-black'],
      },
      {
        id: 'hs-v-silver',
        productId: 'test-p',
        imageId: 'img-test',
        x: 30,
        y: 30,
        title: 'Raw Silver Finish',
        description: 'Silver only detail',
        order: 3,
        variantIds: ['v-silver'],
      },
    ];

    saveHotspotsForImage('img-test', 'test-p', testHotspots);

    // Query for 'v-black'
    const blackResults = getHotspotsForImage('img-test', 'v-black');
    assert.strictEqual(blackResults.length, 2);
    assert.ok(blackResults.some((h) => h.id === 'hs-v-all'));
    assert.ok(blackResults.some((h) => h.id === 'hs-v-black'));
    assert.ok(!blackResults.some((h) => h.id === 'hs-v-silver'));

    // Query for 'v-silver'
    const silverResults = getHotspotsForImage('img-test', 'v-silver');
    assert.strictEqual(silverResults.length, 2);
    assert.ok(silverResults.some((h) => h.id === 'hs-v-all'));
    assert.ok(silverResults.some((h) => h.id === 'hs-v-silver'));

    // Query without variant -> returns all 3
    const allResults = getHotspotsForImage('img-test');
    assert.strictEqual(allResults.length, 3);

    // Clean up
    testHotspots.forEach((h) => deleteHotspot(h.id));
  });
});
