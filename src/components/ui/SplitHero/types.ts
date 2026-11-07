/**
 * Type definitions for SplitHero component.
 * Supports configurable split halves (Women/Men, Fashion/Home, New/Archive)
 * with robust media, inclusive escape hatches, and accessibility features.
 */

export interface SplitMediaImage {
  /** Source image URL (AVIF/WebP preferred) */
  src: string;
  /** Responsive srcset string (e.g. "image-600.webp 600w, image-1200.webp 1200w") */
  srcset?: string;
  /** Alternative alias for srcset */
  srcSet?: string;
  /** Intrinsic width to prevent layout shift */
  width: number;
  /** Intrinsic height to prevent layout shift */
  height: number;
  /** CSS object-position focal point, e.g. "50% 30%" or "center top" */
  objectPosition?: string;
  /** Accessible description of the image subject; leave empty if decorative or repeated in label */
  alt: string;
  /** Dominant color matte placeholder to avoid flash/pop-in during image decode */
  placeholderColor?: string;
}

export interface SplitMediaVideo {
  /** Direct video source URL (e.g. MP4/WebM) */
  src: string;
  /** Poster image URL used before playback and under reduced-motion / data-saver */
  poster: string;
  /** MIME type, e.g. "video/mp4" */
  mimeType?: string;
}

export interface SplitQuickLink {
  /** Visual label, e.g. "New in", "Best sellers", "Sale" */
  label: string;
  /** Destination URL */
  href: string;
  /** Accessible aria-label override */
  ariaLabel?: string;
}

export interface SplitHalfConfig {
  /** Unique identifier for the half (e.g. "women", "men", "fashion", "home") */
  id: string;
  /** Primary display label in large editorial type */
  label: string;
  /** One-line descriptor, recommended ~60 chars max */
  descriptor: string;
  /** Primary navigation destination when the half is clicked */
  href: string;
  /** Quiet CTA text, e.g. "Shop women" */
  cta: string;
  /** Image media specification */
  image: SplitMediaImage;
  /** Optional looping background video */
  video?: SplitMediaVideo;
  /** Optional quick links revealed when the half is expanded */
  quickLinks?: SplitQuickLink[];
  /** Fallback alt text if image.alt is omitted */
  alt?: string;
}

export interface SplitHeroShopAllConfig {
  /** Display label for the escape hatch pill. Defaults to "Shop all" */
  label?: string;
  /** Destination URL. Defaults to "/products" */
  href?: string;
  /** Accessible label. Defaults to "Shop all categories without selecting a split" */
  ariaLabel?: string;
}

export interface SplitHeroProps {
  /** Exactly two items representing the split halves */
  halves: [SplitHalfConfig, SplitHalfConfig] | SplitHalfConfig[];
  /** Inclusive escape hatch configuration */
  shopAll?: SplitHeroShopAllConfig;
  /** Accessible page h1 heading text. Defaults to "MATTE. — Architectural Essentials" */
  pageTitle?: string;
  /** Whether the page h1 is visually hidden (true) or visible across the seam. Defaults to true */
  isH1Hidden?: boolean;
  /** Optional custom class name applied to root section */
  className?: string;
  /** Force neutral 50/50 state without hover expansion (e.g., for testing or low-power modes) */
  forceNeutral?: boolean;
  /** Optional preference memory: remember last selected half locally */
  rememberLastChoice?: boolean;
  /** Storage key for last selected choice */
  storageKey?: string;
  /** Text direction override ("ltr" or "rtl") */
  dir?: 'ltr' | 'rtl';
  /** Navbar height to subtract if navbar is in flow (defaults to "0px" as navbar floats) */
  navbarHeight?: string;
  /** Notification callback whenever active expanded half changes */
  onActiveChange?: (activeId: string | null) => void;
  /** Custom test ID for automation */
  testId?: string;
}

export interface SplitMotionTokens {
  neutralGrow: number;
  expandedGrow: number;
  compressedGrow: number;
  duration: number;
  ease: readonly [number, number, number, number];
  hoverIntentDelay: number;
  returnDelay: number;
}
