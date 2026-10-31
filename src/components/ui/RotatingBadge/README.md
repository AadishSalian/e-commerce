# RotatingBadge

A quiet, crisp, reusable circular trust badge designed for hero sections. Displays text set along a circular SVG path slowly rotating around a static center icon, reinforcing customer trust (returns, shipping, warranty) without visual noise or flashy sticker aesthetics.

## Design Philosophy & Principles

- **Single Truth Promise:** All promises (e.g. "Free returns • 30 days") originate from centralized policy configuration (`src/config/trustPolicies.ts`). If a policy is disabled or missing, the badge automatically hides rather than displaying an outdated promise.
- **Matte Restraint:** Strict alignment with the MATTE design system. No glows, no starbursts, no gradients, and no drop shadows. Uses 1px hairline borders and `currentColor` theme tokens with optional accent bullets (`var(--accent)`).
- **Smooth Deceleration:** Hovering or focusing smoothly decelerates rotation to a standstill, allowing effortless reading on demand without jarring jumps.
- **Strict Single Hero Limit:** Maximum one trust seal per page located in an unobstructed hero corner.

---

## Props Reference

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `preset` | `'returns-30'` \| `'shipping-pan-india'` \| `'warranty-2yr'` \| `'brand-matte'` | `'returns-30'` | Approved policy preset. Guarantees claims never drift from legal policies. |
| `text` | `string` | *(preset)* | Custom phrase. Automatically converted to uppercase with balanced repeating separators. |
| `accessibleLabel` | `string` | *(auto)* | Accessible description for screen readers announced once (SVG is marked `aria-hidden`). |
| `icon` | `'arrow-return'` \| `'truck'` \| `'shield'` \| `'brand-mark'` \| `ReactNode` | `'arrow-return'` | Static center icon aligned on whole/half pixels. |
| `href` | `string` | `'/returns'` | Target policy link. When provided, renders as an accessible link with a round outer focus ring. |
| `size` | `number` \| `'sm'` \| `'md'` \| `'lg'` \| `'responsive'` | `'responsive'` | Physical badge diameter. Responsive: 68px (mobile), 80px (tablet), 108px (desktop). |
| `speed` | `number` | `24` | Revolution duration in seconds (recommended 18s–30s; clamped to 12s–36s). |
| `direction` | `'clockwise'` \| `'counter-clockwise'` | `'clockwise'` | Rotation direction. |
| `corner` | `'bottom-right'` \| `'bottom-left'` \| `'top-right'` \| `'top-left'` \| `'none'` | `'bottom-right'` | Placement corner. Clears notches, home indicator, and mobile bottom navigation tab bar. |
| `separator` | `string` | `'•'` | Glyphs between phrase repetitions (e.g. `'•'` or `'✦'`). |
| `accentSeparators` | `boolean` | `true` | Highlights separator glyphs with subtle theme accent (`var(--accent)`). |
| `repeats` | `number` | *(auto)* | Number of phrase repetitions. Computed automatically to eliminate seams. |
| `showInnerRing` | `boolean` | `true` | Toggles the subtle hairline inner border circle. |
| `showDisc` | `boolean` | `true` | Toggles the solid/matte surface disc background. |
| `entranceComplete` | `boolean` | `true` | Coordinates with hero entrance animations. Fades and scales in after hero text reveals. |
| `minTextDisplaySize` | `number` | `64` | Below this size, text is dropped and the compact static icon seal is shown. |
| `policyKey` | `keyof TrustPolicies` | `undefined` | Optional explicit policy link. If policy is disabled, the badge returns `null`. |

---

## Approved Presets

Staff and administrators select from approved presets rather than typing unverified claims:

```tsx
import { RotatingBadge } from '@/components/ui';

// 1. Returns policy (driven by RETURN_WINDOW_DAYS and RETURN_POLICY_ENABLED)
<RotatingBadge preset="returns-30" />

// 2. Shipping policy (driven by SHIPPING_REGION and FREE_SHIPPING_THRESHOLD)
<RotatingBadge preset="shipping-pan-india" />

// 3. Hardware Warranty (driven by WARRANTY_YEARS and WARRANTY_ENABLED)
<RotatingBadge preset="warranty-2yr" />
```

---

## Technical Details

### SVG Geometry & Seam Elimination
- Built inside a square `0 0 120 120` viewBox.
- Path radius: `r = 43.5` ($C = 2 \pi r \approx 273.32\text{px}$).
- Path constructed with two 180° arcs starting at 12 o'clock (`M 60 16.5 A 43.5 ...`).
- Dynamic phrase repeat calculation (`formatSeamlessCircularText`) formats each repeat unit as `${PHRASE} • `. When multiplied around the circumference, the final gap before the starting character is identical to the interior gaps, preventing any visible seam.
- Uses native `<textPath textLength={circumference} lengthAdjust="spacing">`.

### Motion & Deceleration
- Rotation is driven by Framer Motion `useAnimationFrame` updating a `MotionValue`. React component re-renders are never triggered during rotation.
- Silky deceleration via `useSpring` on hover and focus slows the speed multiplier from `1` to `0` over ~350ms.
- IntersectionObserver and `document.visibilitychange` listeners pause the animation loop whenever offscreen or backgrounded, conserving CPU and battery.
- `useReducedMotion()` strictly disables rotation and renders the badge static.

### Placement & Overlap Rules
- Positioned in the lower-right hero corner (`bottom-right`) by default.
- Mobile clearance: `bottom: calc(4.75rem + env(safe-area-inset-bottom, 0px))`, safely floating above fixed bottom navigation bars.
- Z-Index: `z-20`, rendering below fixed navigation (`z-40`), bottom tab bars (`z-50`), and modal dialogs (`z-50`).
- Suppressed automatically on high-noise transactional routes (`/cart`, `/checkout`, `/account`, `/login`).

### Internationalization
- When complex script languages (Devanagari, Arabic, Tamil) are detected, SVG textPath distortion is bypassed, automatically rendering an accessible, elegant horizontal matte pill.
