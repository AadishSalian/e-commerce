# StackedCards

A quiet, reusable stacked sticky cards section designed for sequential narratives (process steps, brand values, milestones). As the shopper scrolls, each card pins near the top of the viewport and the subsequent card slides up over it, stacking like a physical deck.

## Principles & Restraint

- **Paced Narrative:** Turns sequences into a calm, focused story where each step receives the viewer's undivided attention.
- **Deck Pacing:** Strictly calibrated for **3 to 5 cards**. Fewer than 3 cards fails to convey a deck, and more than 5 cards feels exhausting to scroll through.
- **Honest & Non-Trapping:** Every card is 100% legible when active. If a card's content exceeds the available pinned viewport height, or if the viewport is short (< 600px), stacking gracefully falls back to a clean vertical flow list.
- **Matte Aesthetics:** Layer separation achieved through subtle tone shifts (`#141414`, `#181818`, `#1c1c1c`...) and a static top-edge shadow. No box-shadow animation, no glossy gradients, and no glowing filters.

---

## Props Reference

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `cards` | `StackedCardItem[]` | *(required)* | Array of 3 to 5 card sequence items. |
| `title` | `string` | `undefined` | Optional section landmark heading. |
| `eyebrow` | `string` | `undefined` | Optional section eyebrow tag. |
| `description` | `string` | `undefined` | Optional narrative introductory paragraph. |
| `stackTop` | `number` | `84` (desktop), `72` (mobile) | Pin line offset below viewport top in px. |
| `stackPeek` | `number` | `20` (desktop), `16` (mobile) | Visible strip height (in px) of prior cards peeking above active card. |
| `stackBottomGap`| `number` | *(auto)* | Safe clearance from viewport bottom (integrates with mobile bottom bar & safe areas). |
| `cardMarginBottom` | `string` | `'10svh'` | Margin between card tracks controlling linger duration before being covered. |
| `scaleFactor` | `number` | `0.035` (desktop), `0.02` (mobile) | Scale decrement per depth layer. |
| `maxDimOpacity`| `number` | `0.35` | Maximum opacity of dimming overlay as card is covered. |
| `showProgress` | `boolean` | `true` | Toggles discrete floating progress rail ("02 / 05"). |
| `showGhostNumerals` | `boolean` | `true` | Toggles low-contrast background ghost numerals. |
| `minViewportHeight` | `number` | `600` | Height threshold below which stacking falls back to flow list. |

### `StackedCardItem` Structure

```typescript
interface StackedCardItem {
  id: string;               // Unique id for DOM anchoring (#step-1)
  eyebrow?: string;         // Accent-colored category or step number
  title: string;            // Card heading (h3)
  body: string | ReactNode; // Card body description
  image?: string | Image;   // Optional image for the two-column layout
  link?: {                  // Optional single link/CTA
    href: string;
    label: string;
    isExternal?: boolean;
  };
  badge?: string;           // Optional subtle tag
  ghostNumeral?: string;    // Custom ghost numeral (defaults to 01, 02...)
  toneShift?: {             // Custom dark/light surface tone
    dark?: string;
    light?: string;
  };
  customContent?: ReactNode;// Custom JSX content inside the card
}
```

---

## Critical Layout Rules

1. **No Ancestor Overflow:** CSS `position: sticky` breaks if any ancestor has `overflow: hidden`, `overflow: auto`, or `overflow: scroll`. Use `overflow: clip` if clipping is necessary. StackedCards includes a dev-mode validator that walks the DOM and warns of violations.
2. **No Ancestor Transforms:** Ancestors must not have `transform`, `filter`, or `perspective`, as they create a new containing block and kill sticky positioning.
3. **Content-Fit Rule:** A pinned card taller than available viewport space (`100svh - stackTop - stackBottomGap`) would trap content. StackedCards measures content with `ResizeObserver` and falls back to normal unstacked flow if content overflows.
4. **Transform Isolation:** Visual transforms (`scale`, `y`, `opacity`) are applied exclusively to an inner wrapper (`.cardInner`) with `transform-origin: top center`, keeping sticky positioning stable.
5. **Keyboard Trapping Prevention:** When keyboard focus moves into a card via tabbing, `onFocusCapture` invokes `scrollIntoView({ block: "start", behavior: "smooth" })` to ensure the focused element is never hidden beneath subsequent cards or the navbar.
