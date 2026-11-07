# SplitHero

A reusable, full-viewport split hero with hover expansion designed for the MATTE aesthetic. It divides the viewport into two configurable halves (such as Women / Men, Fashion / Home, or New / Archive) that expand on hover or focus to approximately 70% while the other half compresses to 30%, remaining legible and clickable throughout.

---

## Purpose and Principles

- **Editorial Navigation**: Gets shoppers directly into the relevant catalog destination in a single move, feeling like a quiet high-end publication spread rather than a promotional banner.
- **Calm, Precise Motion**: Uses calibrated bezier easing `[0.65, 0, 0.35, 1]` over 700ms. Strictly no bounce, no tilt, and no zoom jolts.
- **Complete Neutral State**: The unhovered 50/50 state is fully balanced, legible, and visually complete before any cursor interaction.
- **Zero Layout Shift & Zero Image Distortion**: Media elements have a fixed width equal to the expanded half width (70vw) and are masked by the half container's overflow. Images never squish, scale, or re-render during expansion.
- **Inclusive Escape Hatch**: A centered "Shop all" pill across the boundary ensures shoppers who don't fit the binary split are never trapped into choosing a side.

---

## Motion Tokens

Configured in `tokens.ts`:

```ts
export const SPLIT = {
  neutralGrow: 1,        // each half at rest (50/50)
  expandedGrow: 7,       // hovered half (70%)
  compressedGrow: 3,     // inactive half (30%)
  duration: 0.7,         // seconds
  ease: [0.65, 0, 0.35, 1],
  hoverIntentDelay: 90,  // ms debounce before expanding
  returnDelay: 300,      // ms delay before returning to 50/50
};
```

---

## Configuration & Usage

```tsx
import { SplitHero } from '@/components/ui/SplitHero';
import { WOMEN_MEN_SPLIT_HERO } from '@/config/splitHero';

export default function Page() {
  return (
    <SplitHero
      halves={WOMEN_MEN_SPLIT_HERO}
      shopAll={{
        label: 'Shop all',
        href: '/products',
        ariaLabel: 'Shop all collections',
      }}
      pageTitle="MATTE. — Architectural Essentials"
    />
  );
}
```

### Half Configuration Object

```ts
export interface SplitHalfConfig {
  id: string;
  label: string;
  descriptor: string;
  href: string;
  cta: string;
  image: {
    src: string;
    srcset?: string;
    width: number;
    height: number;
    objectPosition?: string;
    alt: string;
    placeholderColor?: string;
  };
  video?: {
    src: string;
    poster: string;
    mimeType?: string;
  };
  quickLinks?: Array<{
    label: string;
    href: string;
  }>;
}
```

---

## Interaction Model

1. **Desktop with Fine Pointer (`hover: hover` and `pointer: fine`)**:
   - Pointer enters a half: Waits 90ms (`hoverIntentDelay`). If pointer stays, that half smoothly expands (`flexGrow: 7`) while the other compresses (`flexGrow: 3`).
   - Pointer crosses the seam: Smoothly retargets from the current animated position with zero flicker or jumps.
   - Pointer leaves the hero: Waits 300ms (`returnDelay`) before gently easing back to neutral 50/50.
   - Entire half is a clickable link (`<a>`). Quick links inside the expanded half are real links that navigate without triggering the parent link (`stopPropagation`).
2. **Keyboard Navigation (`focus-within`)**:
   - Tabbing onto a half link expands it immediately and prefetches its destination.
   - Tabbing into its quick links keeps it expanded.
   - Tabbing to the "Shop all" pill returns the split to neutral 50/50.
   - Outer-edge focus ring (`outline: 2px solid var(--accent); outline-offset: -2px`) is never clipped by `overflow: hidden`.
3. **Mobile & Touch (< 768px)**:
   - Stacks vertically into two `50svh` panels.
   - Direct single-tap navigation with subtle pressed feedback (`:active`).
   - No tap-to-expand step and no sticky hover states.
   - "Shop all" pill positioned clear of `env(safe-area-inset-bottom)`.
4. **Short Viewports (< 560px height)**:
   - Expansion is disabled; locks into static 50/50 layout to prevent vertical clipping.

---

## Entrance Sequencing & Site Intro Coordination

- **BrandReveal Coordination**: Watches for the site intro overlay. If `brand_reveal_played` or `data-intro="played"`, entrance starts immediately; otherwise, it listens for the `brand-reveal-complete` custom event.
- **Repeat View Skipping**: Sets `sessionStorage.setItem('split_hero_intro_seen', 'true')` after the first view, skipping the entrance sequence on subsequent visits within that session.
- **Sequence Steps**:
  1. Outer-edge clip-in reveals halves over 700ms with `SPLIT.ease`.
  2. Display labels and descriptors fade up (staggered 80ms).
  3. CTAs and the "Shop all" pill fade in. Total duration ≤ 1.4s.
  4. Hover expansion is enabled only after the entrance sequence finishes.

---

## Performance & Accessibility

- **LCP Optimization**: Above-the-fold image preloads (`<link rel="preload" fetchPriority="high">`), explicit dimensions to prevent layout shifts (`100svh`), and dominant-color matte placeholders.
- **Video Handling**: Muted, playsinline, looped. Pauses when off-screen (`IntersectionObserver`) or when the tab is hidden (`visibilitychange`). Falls back to poster under `prefers-reduced-motion`, `saveData`, or slow 2G connections. Accessible pause/play toggle is provided.
- **WCAG AA Contrast**: Bottom- and edge-weighted dark gradient ensures ≥ 7:1 contrast on all photography.
- **Print & High Contrast**: Includes `@media print` and `@media (forced-colors: active)` support.
