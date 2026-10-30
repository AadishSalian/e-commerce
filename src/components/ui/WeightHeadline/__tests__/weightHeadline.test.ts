import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  WEIGHT_FX,
  smoothstep,
  computeProximityWeight,
  distanceToRect,
  distanceToPoint,
  splitGraphemes,
  isComplexScript,
} from '../tokens';
import { coordinator } from '../coordinator';

describe('WeightHeadline Motion Tokens & Mathematical Calibrations', () => {
  it('strictly adheres to the design tokens for the matte proximity specification', () => {
    assert.strictEqual(WEIGHT_FX.baseWeight, 400, 'Light theme resting weight must be 400');
    assert.strictEqual(WEIGHT_FX.baseWeightDark, 380, 'Dark theme resting weight must be 380 to adjust for halation');
    assert.strictEqual(WEIGHT_FX.maxWeight, 620, 'Peak weight must be 620 (+220 to +240 delta)');
    assert.strictEqual(WEIGHT_FX.radius, 180, 'Proximity radius must be 180px');
    assert.strictEqual(WEIGHT_FX.curve, 'smoothstep', 'Falloff curve must be smoothstep');
    assert.strictEqual(WEIGHT_FX.spring.stiffness, 180, 'Spring stiffness must be 180');
    assert.strictEqual(WEIGHT_FX.spring.damping, 26, 'Spring damping must be 26 (critically damped)');
    assert.strictEqual(WEIGHT_FX.spring.mass, 0.7, 'Spring mass must be 0.7');
    assert.strictEqual(WEIGHT_FX.maxLetterCount, 40, 'Max letter count cap must be 40');
  });

  it('smoothstep function satisfies boundary conditions and zero derivatives at edges', () => {
    // S(0) = 0, S(1) = 1, S(0.5) = 0.5
    assert.strictEqual(smoothstep(0), 0);
    assert.strictEqual(smoothstep(1), 1);
    assert.strictEqual(smoothstep(0.5), 0.5);

    // Clamping beyond [0, 1]
    assert.strictEqual(smoothstep(-0.5), 0);
    assert.strictEqual(smoothstep(1.5), 1);

    // Zero derivative at t=0 and t=1 (slope is smooth, no hard edge)
    const delta0 = smoothstep(0.01) - smoothstep(0);
    const delta1 = smoothstep(1) - smoothstep(0.99);
    // Linear slope of 0.01 would be 0.01; smoothstep 3*(0.01)^2 - 2*(0.01)^3 is ~0.000298 (< 0.0005)
    assert.ok(delta0 < 0.001, 'Slope near t=0 must approach 0 to prevent snap');
    assert.ok(delta1 < 0.001, 'Slope near t=1 must approach 0 to prevent snap');
  });

  it('computes proximity weight smoothly based on distance', () => {
    // Cursor right on or inside headline (distance 0)
    assert.strictEqual(computeProximityWeight(0, 180, 400, 620), 620);
    assert.strictEqual(computeProximityWeight(-20, 180, 400, 620), 620);

    // Cursor at or beyond radius boundary
    assert.strictEqual(computeProximityWeight(180, 180, 400, 620), 400);
    assert.strictEqual(computeProximityWeight(250, 180, 400, 620), 400);

    // Dark mode resting base weight test
    assert.strictEqual(computeProximityWeight(0, 180, 380, 620), 620);
    assert.strictEqual(computeProximityWeight(180, 180, 380, 620), 380);

    // Halfway point (distance 90 of 180) -> factor is smoothstep(0.5) = 0.5
    // 400 + (620 - 400) * 0.5 = 510
    assert.strictEqual(computeProximityWeight(90, 180, 400, 620), 510);
    // Dark mode halfway: 380 + (620 - 380) * 0.5 = 500
    assert.strictEqual(computeProximityWeight(90, 180, 380, 620), 500);
  });
});

describe('Geometry & Distance Calculations', () => {
  const rect = { left: 100, top: 100, right: 300, bottom: 150 };

  it('distanceToRect returns 0 when pointer is inside bounding box', () => {
    assert.strictEqual(distanceToRect(150, 120, rect), 0);
    assert.strictEqual(distanceToRect(100, 100, rect), 0);
    assert.strictEqual(distanceToRect(300, 150, rect), 0);
  });

  it('distanceToRect computes correct orthogonal and diagonal Euclidean distances', () => {
    // Directly to the left by 50px
    assert.strictEqual(distanceToRect(50, 120, rect), 50);
    // Directly above by 30px
    assert.strictEqual(distanceToRect(200, 70, rect), 30);
    // Directly to the right by 40px
    assert.strictEqual(distanceToRect(340, 120, rect), 40);
    // Directly below by 60px
    assert.strictEqual(distanceToRect(200, 210, rect), 60);

    // Diagonal: 30px left of left (x=70) and 40px above top (y=60) -> 3-4-5 triangle = 50px
    assert.strictEqual(distanceToRect(70, 60, rect), 50);
  });

  it('distanceToPoint calculates Euclidean distance to letter center', () => {
    assert.strictEqual(distanceToPoint(100, 100, 100, 100), 0);
    assert.strictEqual(distanceToPoint(100, 140, 100, 100), 40);
    assert.strictEqual(distanceToPoint(103, 104, 100, 100), 5); // 3-4-5
  });
});

describe('Script Safety & Grapheme Splitting', () => {
  it('correctly classifies Latin and standard Western scripts as safe for letter splitting', () => {
    assert.strictEqual(isComplexScript('Engineered for the Obsessive.'), false);
    assert.strictEqual(isComplexScript('From Raw To Refined'), false);
    assert.strictEqual(isComplexScript('Made To Be Kept.'), false);
  });

  it('flags joined and complex scripts to enforce Mode A fallback and prevent ligature breaking', () => {
    assert.strictEqual(isComplexScript('تصميم مخصص'), true, 'Arabic must be flagged');
    assert.strictEqual(isComplexScript('शिल्पकला'), true, 'Devanagari must be flagged');
    assert.strictEqual(isComplexScript('வடிவமைப்பு'), true, 'Tamil must be flagged');
    assert.strictEqual(isComplexScript('งานฝีมือ'), true, 'Thai must be flagged');
  });

  it('preserves multi-code-point characters and spacing with Intl.Segmenter', () => {
    const text = 'Matte & Clean';
    const graphemes = splitGraphemes(text);
    assert.strictEqual(graphemes.length, 13);
    assert.strictEqual(graphemes.join(''), text);
    assert.strictEqual(graphemes[5], ' ', 'Whitespace grapheme preserved');
  });
});

describe('Viewport Coordinator: Single-Active Instance Enforcement', () => {
  it('activates the closest headline when multiple instances intersect the viewport', () => {
    let headline1Active = false;
    let headline2Active = false;

    // Headline 1 at top: [100, 100] to [400, 150]
    const unreg1 = coordinator.register({
      id: 'h1',
      getRect: () => ({ left: 100, top: 100, right: 400, bottom: 150 }),
      setActive: (val) => {
        headline1Active = val;
      },
      inView: true,
    });

    // Headline 2 lower down: [100, 600] to [400, 650]
    const unreg2 = coordinator.register({
      id: 'h2',
      getRect: () => ({ left: 100, top: 600, right: 400, bottom: 650 }),
      setActive: (val) => {
        headline2Active = val;
      },
      inView: true,
    });

    // Pointer near Headline 1 (y = 120)
    const active1 = coordinator.updateActiveHeadline(200, 120);
    assert.strictEqual(active1, 'h1');
    assert.strictEqual(headline1Active, true, 'Headline 1 must be active');
    assert.strictEqual(headline2Active, false, 'Headline 2 must remain inactive');

    // Pointer moves down near Headline 2 (y = 620)
    const active2 = coordinator.updateActiveHeadline(200, 620);
    assert.strictEqual(active2, 'h2');
    assert.strictEqual(headline1Active, false, 'Headline 1 must deactivate');
    assert.strictEqual(headline2Active, true, 'Headline 2 must activate');

    // Pointer leaves window
    coordinator.resetAll();
    assert.strictEqual(headline1Active, false);
    assert.strictEqual(headline2Active, false);

    unreg1();
    unreg2();
  });

  it('automatically deactivates instance when it leaves the viewport', () => {
    let isActive = false;
    const unreg = coordinator.register({
      id: 'out-of-view-test',
      getRect: () => ({ left: 0, top: 0, right: 100, bottom: 50 }),
      setActive: (val) => {
        isActive = val;
      },
      inView: true,
    });

    coordinator.updateActiveHeadline(50, 25);
    assert.strictEqual(isActive, true);

    coordinator.setInView('out-of-view-test', false);
    assert.strictEqual(isActive, false);

    unreg();
  });
});
