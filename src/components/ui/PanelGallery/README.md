# PanelGallery

A reusable, accessible hover-expanding panel gallery built with React, Next.js, and Framer Motion. Engineered for our quiet matte dark/light aesthetic, it provides an interactive alternative to the category bento grid.

## Design Principles

- **Calm, Precise Motion**: Uses calibrated easing `[0.65, 0, 0.35, 1]` with zero bounce, tilt, or zoom jolts.
- **Legible Compressed State**: Inactive panels maintain a structured vertical label with category numerals (`01`–`06`) and truncated titles, never collapsing into unreadable slivers.
- **Moving-Mask Image Architecture**: Inner image wrappers maintain a fixed expanded width centered on their focal point (`objectPosition`). The panel's outer animated `flex-grow` acts as a moving mask, preventing image squishing, rescaling, or layout recalculations.
- **Inclusive Accessibility**: Screen readers receive full titles, descriptions, and item counts regardless of visual expansion state. Touch screens automatically adapt into a vertical accordion where the first tap previews and the second tap navigates.
- **Strict Exclusivity**: Designed to serve as the homepage category showcase alternatively to the Bento Grid—use one or the other on a page, never both.

---

## Data & Configuration

Category panels are passed via props from CMS or configuration, never hardcoded in component markup:

```tsx
import { PanelGallery } from '@/components/ui/PanelGallery';
import { HOMEPAGE_CATEGORY_PANELS } from '@/config/categories';

export default function CategorySection() {
  return (
    <PanelGallery
      panels={HOMEPAGE_CATEGORY_PANELS}
      defaultActiveId="fashion"
      title="Curated Categories"
      subtitle="Explore Collections"
      viewAllHref="/categories"
    />
  );
}
```

### `PanelItem` Interface

```ts
interface PanelItem {
  id: string;
  title: string;
  description?: string;        // One line, ~80 characters max
  itemCount?: number | string; // e.g. 142 or "140+ items"
  href: string;                // Destination route
  image: {
    src: string;
    srcset?: string;
    width: number;
    height: number;
    objectPosition?: string;   // Focal point (e.g. "50% 30%")
    dominantColor?: string;    // Fallback matte color (e.g. "#1c1b18")
  };
  alt: string;
}
```

---

## Motion Tokens

All motion constants are centralized in `tokens.ts`:

| Token | Value | Purpose |
| :--- | :--- | :--- |
| `expandedGrow` | `5` | Active panel flex expansion weight |
| `compressedGrow` | `1` | Inactive panel flex weight |
| `duration` | `0.6s` | Panel expansion transition duration |
| `ease` | `[0.65, 0, 0.35, 1]` | Non-overshooting cubic-bezier curve |
| `hoverIntentDelay` | `90ms` | Debounce delay preventing flicker during cursor sweeps |
| `returnDelay` | `350ms` | Graceful delay before returning to default active panel |
| `textExitDuration` | `0.12s` | Fast fade-out of compressed labels during expansion |
| `textEnterDuration` | `0.35s` | Smooth fade and rise of expanded text block |
| `textEnterDelay` | `0.15s` | Delay preventing text squeezing mid-expansion |
| `underlineDuration` | `0.4s` | Accent underline draw-in duration |

---

## Responsive & Touch Interactions

1. **Desktop (`hover: hover` and `pointer: fine`)**:
   - Flex row with fixed height (`clamp(440px, 72svh, 660px)`).
   - Hover intent prevents accidental activations.
   - Leaving the row gently returns to `defaultActiveId` after `350ms`.
   - `focus-within` expands panels identically for keyboard users.
2. **Mobile & Touch Devices (`pointer: coarse` or `< 1024px`)**:
   - Switches to a vertical accordion stack.
   - Collapsed panels are `84px` tall (well above the `56px` minimum tap target).
   - Expanded panel expands to `52svh`.
   - **Two-Step Touch Safety**: The first tap on a collapsed panel expands it and announces the change via `aria-live="polite"`. Tapping the expanded panel or its "Explore category &rarr;" CTA navigates, preventing accidental page transitions and sticky hover bugs.
3. **Panel Count Adaptation**:
   - **< 4 panels**: Automatically renders an equal-width static grid to maintain visual balance.
   - **4 to 6 panels**: Standard interactive expanding gallery.
   - **> 6 panels**: Displays the first 6 panels and provides a "View all categories" link.

---

## Theming & Matte Aesthetic

- Uses CSS custom properties: `var(--background)`, `var(--foreground)`, `var(--border-subtle)`, and `var(--accent)`.
- Bottom-weighted matte gradient (`rgba(0, 0, 0, 0.9)` to transparent) guarantees WCAG AA contrast for text over any photograph in both light and dark mode.
- Active panel dark overlay opacity is reduced to `0.38` while inactive panels dim to `0.76`.
- 1px subtle border with large card radii (`16px`) and `overflow: clip`.
- Subtle SVG film grain overlay (`opacity: 0.12`) with `mix-blend-mode: overlay`.

---

## Accessibility (a11y)

- **Semantic DOM**: Rendered as a labeled list (`role="list"` and `role="listitem"`) inside a landmark `<section>`.
- **Screen Reader Parity**: Screen reader text (`.srOnly`) contains the full title, description, and item count inside the link in both compressed and expanded visual states.
- **ARIA Attributes**: Desktop active panel has `aria-current="true"`. Mobile accordion button has `aria-expanded`.
- **Keyboard Navigation**: `Tab` cycles through panels; `ArrowLeft`/`ArrowRight` (or `ArrowUp`/`ArrowDown` in accordion) smoothly navigates and expands adjacent panels, with full RTL support.
- **Prefers Reduced Motion**: When `prefers-reduced-motion: reduce` is enabled, all layout transitions become instantaneous (`duration: 0`) and animations are disabled while maintaining complete interactivity.
