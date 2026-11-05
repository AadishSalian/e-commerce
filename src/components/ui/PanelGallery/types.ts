/**
 * Types and interfaces for the PanelGallery component.
 */

export interface PanelImage {
  /** Source URL for the image */
  src: string;
  /** Responsive image srcset string */
  srcset?: string;
  /** Intrinsic or display width in pixels */
  width: number;
  /** Intrinsic or display height in pixels */
  height: number;
  /** CSS object-position focal point (e.g. "50% 35%", "center 20%") */
  objectPosition?: string;
  /** Fallback matte dominant color hex (e.g. "#1e1e1e") */
  dominantColor?: string;
}

export interface PanelItem {
  /** Unique identifier for the panel */
  id: string;
  /** Category or showcase title */
  title: string;
  /** One-line description (~80 characters max) */
  description?: string;
  /** Optional item or product count (e.g. 142 or "140+ items") */
  itemCount?: number | string;
  /** Destination navigation URL */
  href: string;
  /** Panel image configuration */
  image: PanelImage;
  /** Accessible alt text for the image */
  alt: string;
}

export interface PanelGalleryMotionTokens {
  /** Flex-grow weight for the active expanded panel (default: 5) */
  expandedGrow: number;
  /** Flex-grow weight for inactive compressed panels (default: 1) */
  compressedGrow: number;
  /** Transition duration in seconds for panel flex resize (default: 0.6) */
  duration: number;
  /** Bezier easing curve [x1, y1, x2, y2] (default: [0.65, 0, 0.35, 1]) */
  ease: readonly [number, number, number, number];
  /** Hover intent debounce delay in milliseconds (default: 90) */
  hoverIntentDelay: number;
  /** Delay in milliseconds before returning to default panel when pointer leaves (default: 350) */
  returnDelay: number;
  /** Text exit transition duration in seconds (default: 0.12) */
  textExitDuration: number;
  /** Text entrance transition duration in seconds (default: 0.35) */
  textEnterDuration: number;
  /** Text entrance delay in seconds (default: 0.15) */
  textEnterDelay: number;
  /** Title underline draw-in duration in seconds (default: 0.4) */
  underlineDuration: number;
  /** Stagger delay between panels during initial entrance in seconds (default: 0.08) */
  revealStagger: number;
  /** Duration of initial panel reveal in seconds (default: 0.6) */
  revealDuration: number;
}

export interface PanelGalleryProps {
  /** List of panels to display (optimally 4 to 6 items) */
  panels: PanelItem[];
  /** Identifier of the panel expanded by default (defaults to first panel) */
  defaultActiveId?: string;
  /** Whether the gallery returns to defaultActiveId when pointer leaves the row (default: true) */
  returnToDefaultOnLeave?: boolean;
  /** Custom motion token overrides */
  motionTokens?: Partial<PanelGalleryMotionTokens>;
  /** Section heading title (optional, e.g. "Curated Categories") */
  title?: string;
  /** Section subtitle or eyebrow */
  subtitle?: string;
  /** URL for the "View all categories" link when panels > 6 */
  viewAllHref?: string;
  /** Custom label for "View all categories" (default: "View all categories") */
  viewAllLabel?: string;
  /** Custom className applied to the root section */
  className?: string;
  /** Custom className applied to the inner gallery container */
  containerClassName?: string;
  /** Accessible label for the section landmark (default: "Shop by category") */
  sectionAriaLabel?: string;
  /** Callback fired when the active panel changes */
  onPanelChange?: (activeId: string) => void;
  /** Forced display layout mode for testing or responsive control */
  layoutMode?: 'auto' | 'desktop-only' | 'accordion-only';
}
