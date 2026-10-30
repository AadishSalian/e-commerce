# WeightHeadline

A variable-font weight proximity headline component built with Framer Motion, specifically calibrated for the MATTE brand design system.

As the cursor approaches a headline, its weight thickens smoothly and symmetrically, relaxing back to its resting weight when the pointer leaves.

---

## 🎯 Where to Use It & Where NOT to Use It

> [!IMPORTANT]
> This effect is designed for restraint and high typographic impact. It is very easy to overdo.
> Keep it subtle and use it on **at most one active instance per viewport**.

### ✅ Use On:
- **Homepage hero headline** (e.g. `"Engineered for the Obsessive."`)
- **Large category showcase titles** (e.g. prominent category showcase sections)
- **Editorial headlines on storytelling pages** (e.g. Craftsmanship page `"From Raw To Refined"`)

### ❌ DO NOT Use On:
- Body copy or paragraphs
- Navigation links
- Buttons (buttons already have the rolling-text interaction)
- Prices and currency values
- Product names in grids or search lists
- Form inputs, placeholders, or labels
- Any string longer than **40 characters** (longer text will automatically fall back to static or whole-headline mode)

---

## ⚙️ Design Tokens & Motion Physics

The component uses a single, centralized set of design tokens defined in `tokens.ts`. Magic numbers are strictly prohibited.

```ts
const WEIGHT_FX = {
  baseWeight: 400,     // Resting weight for light mode
  baseWeightDark: 380, // Resting weight for dark mode (adjusted lighter for halation)
  maxWeight: 620,      // Peak weight near the cursor (subtle range: +150 to +240 units)
  radius: 180,         // Radius (px) from cursor where proximity fades to zero
  curve: "smoothstep", // 3t^2 - 2t^3: zero first-derivative at both bounds (no hard edge)
  spring: {
    stiffness: 180,
    damping: 26,
    mass: 0.7,
  },                   // Critically damped spring: rapid settling, zero overshoot
};
```

### Rule of Thumb for Safe Weight Ranges
1. **Delta between base and peak**: Keep within **+150 to +240 weight units** (e.g. 380 → 620). Broader deltas (e.g., 200 → 900) create distracting visual pulses, extreme glyph expansion, and micro-jitter.
2. **Theme halation compensation**: White/light text on dark backgrounds appears heavier to human vision than dark text on light backgrounds. Therefore, dark mode rests at `380` and light mode rests at `400`.
3. **Axis clamping**: Weight calculations are clamped strictly within the font family's variable axis range `[100, 900]`.

---

## 🕹️ Interaction Modes

### Mode A: Whole-Headline (Default)
- Driven by the cursor's Euclidean distance to the headline's bounding box.
- Inside the bounding box, distance is `0` (giving peak `maxWeight`).
- Moving away decays smoothly along the `smoothstep` curve out to `radius` (180px).
- Inexpensive, completely stable, and lightweight.

### Mode B: Per-Letter Proximity Wave (`perLetter={true}`)
- Each grapheme cluster calculates its own weight based on the pointer distance to that individual letter's center point.
- Creates a soft, continuous wave of thickness traversing the word under the pointer.
- Splits text with `Intl.Segmenter` (preserving emojis, combining accents, and whitespace).
- **Safety Fallback**: Automatically falls back to Mode A if:
  - Text contains connected/complex scripts (Arabic, Devanagari, Tamil, Thai, etc.) where splitting glyphs would break ligatures and cursive shaping.
  - Text length exceeds 40 characters.
  - The browser frame budget degrades (>16ms over 5 consecutive frames).

---

## 📐 Layout Stability & Zero CLS

Thickening letterforms naturally demand more width. To prevent line breaks, neighbor pushing, or Cumulative Layout Shift (CLS):
1. **Width & Height Reservation**: An exact copy of the headline (`.ghost`) is rendered at `maxWeight` inside the exact same CSS Grid cell (`grid-area: headline`) with `visibility: hidden`, `aria-hidden: true`, and `pointer-events: none`.
2. **Container Sizing**: The container is permanently sized for the maximum weight state. Surrounding content never moves (CLS = 0.000).
3. **Nowrap**: The visible layer enforces `white-space: nowrap`.

---

## ♿ Accessibility & Degraded Environments

- **Semantic Headings**: Renders standard semantic tags (`<h1>`, `<h2>`, etc.) via the `as` prop.
- **Screen Readers**: In Mode B, the container receives `aria-label={text}` while individual letter spans are marked `aria-hidden="true"`, ensuring screen readers announce the headline exactly once without stuttering.
- **Selectable Text**: Visible text retains normal selection (`user-select: text`).
- **Reduced Motion**: Respects `prefers-reduced-motion`. Proximity tracking is completely disabled, and the headline renders statically at resting weight.
- **Touch Devices**: Detected via `(hover: hover) and (pointer: fine)`. Touch devices render statically with an optional one-time subtle ease-in upon first viewport entry (base - 60 → base over 600ms), never replaying.
- **High Contrast / Print**: Degrades cleanly to static resting weight via `@media print` and `@media (forced-colors: active)`.
- **Unsupported Browsers**: Protected via `@supports not (font-variation-settings: normal)`.

---

## 🚀 Viewport Coordinator (Single-Active Instance Rule)

The built-in `coordinator` monitors all headlines intersecting the viewport. When multiple headlines appear in the same viewport, the coordinator calculates which one is nearest to the pointer. Only the nearest headline responds interactively; other visible headlines calmly rest at base weight.

---

## 🛠️ Usage Example

```tsx
import { WeightHeadline } from '@/components/ui';

// Mode A (Whole-headline proximity)
<WeightHeadline as="h1" className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
  Engineered for the Obsessive.
</WeightHeadline>

// Mode B (Per-letter wave opt-in)
<WeightHeadline as="h2" perLetter align="center" className="text-4xl md:text-5xl uppercase tracking-tight text-foreground">
  From Raw To Refined
</WeightHeadline>

// Debug Mode (Shows radius and live weight metrics HUD)
<WeightHeadline as="h1" perLetter debug>
  Precision in Detail
</WeightHeadline>
```
