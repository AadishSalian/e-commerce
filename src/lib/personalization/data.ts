import { CuratedSymbol, EngravingFont, EngravingFinishStyle, EngravingZone } from './types';

export const CURATED_SYMBOLS: CuratedSymbol[] = [
  { id: 'sym-dot', name: 'Center Dot', glyph: '•', category: 'classic' },
  { id: 'sym-heart', name: 'Minimal Heart', glyph: '♥', category: 'classic' },
  { id: 'sym-star', name: 'Four-Point Star', glyph: '✦', category: 'geometric' },
  { id: 'sym-diamond', name: 'Diamond', glyph: '◆', category: 'geometric' },
  { id: 'sym-infinity', name: 'Infinity', glyph: '∞', category: 'geometric' },
  { id: 'sym-leaf', name: 'Olive Leaf', glyph: '🍃', category: 'nature' },
  { id: 'sym-anchor', name: 'Anchor', glyph: '⚓', category: 'classic' },
  { id: 'sym-slash', name: 'Tilted Slash', glyph: '╱', category: 'monogram' },
];

export const ENGRAVING_FONTS: EngravingFont[] = [
  {
    id: 'modern-sans',
    label: 'Modern Sans',
    font_family: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    min_size: 14,
    max_size: 40,
    letter_spacing: '0.12em',
    sample_text: 'ALEXANDER',
    description: 'Crisp, contemporary geometric sans ideal for high-precision laser work.'
  },
  {
    id: 'classic-serif',
    label: 'Classic Serif',
    font_family: '"Cinzel", "Times New Roman", "Baskerville", Georgia, serif',
    google_font: 'Cinzel:wght@500;700',
    min_size: 14,
    max_size: 42,
    letter_spacing: '0.14em',
    sample_text: 'VICTORIA',
    description: 'Timeless Roman proportions with chiselled terminals.'
  },
  {
    id: 'technical-mono',
    label: 'Technical Mono',
    font_family: '"JetBrains Mono", "SF Mono", "Fira Code", monospace',
    google_font: 'JetBrains+Mono:wght@500;600',
    min_size: 12,
    max_size: 36,
    letter_spacing: '0.08em',
    sample_text: 'SPEC-049',
    description: 'Utilitarian monospace inspired by industrial equipment badges.'
  },
  {
    id: 'architect-script',
    label: 'Architect Script',
    font_family: '"Caveat", "Brush Script MT", "Segoe Script", cursive',
    google_font: 'Caveat:wght@600',
    min_size: 16,
    max_size: 48,
    letter_spacing: '0.04em',
    sample_text: 'Jameson',
    description: 'Natural signature flow with human nuance.'
  },
  {
    id: 'heritage-slab',
    label: 'Heritage Slab',
    font_family: '"Copperplate", "Cinzel Decorative", "Arial Black", serif',
    min_size: 14,
    max_size: 44,
    letter_spacing: '0.18em',
    is_uppercase_only: true,
    sample_text: 'H • M • B',
    description: 'Strong architectural capitals for monogram seals.'
  }
];

export const FOIL_THREAD_SWATCHES = [
  { id: 'gold-foil', name: '24k Matte Gold', color: '#c5a358', type: 'foil' },
  { id: 'silver-foil', name: 'Sterling Silver', color: '#d6d9dc', type: 'foil' },
  { id: 'rose-gold', name: 'Warm Rose Gold', color: '#cb8b77', type: 'foil' },
  { id: 'charcoal-thread', name: 'Tonal Charcoal', color: '#2b2b2b', type: 'thread' },
  { id: 'raw-linen', name: 'Raw Natural Linen', color: '#e5dec9', type: 'thread' },
];

export const FINISH_HONEST_DISCLAIMER =
  'Preview is a close digital representation. Final engraving may vary subtly in depth, patina, and grain reflection.';

export const SEED_ENGRAVING_ZONES: EngravingZone[] = [
  // 1. Minimalist Leather Wallet (a-1)
  {
    zone_id: 'zone-wallet-deboss',
    productId: 'a-1',
    name: 'Lower Right Corner Deboss',
    image_id: 'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=1000&auto=format&fit=crop',
    geometry: {
      x: 58.0,
      y: 68.0,
      width: 28.0,
      height: 14.0,
      rotation: -1.5,
      skewX: 1.0,
      skewY: -0.5
    },
    max_lines: 2,
    max_chars_per_line: 12,
    allowed_charset: 'LATIN_BASIC_NUMERIC_PUNCTUATION',
    charset_description: 'Latin letters, numbers, periods, and curated symbols.',
    fonts: ENGRAVING_FONTS,
    default_font_id: 'classic-serif',
    supports_monogram: true,
    supports_alignment: true,
    default_alignment: 'right',
    allowed_symbols: CURATED_SYMBOLS,
    finish_style: 'debossed_leather',
    variant_finish_overrides: {
      'Cognac': { color: '#271509', opacity: 0.85, highlightColor: '#8a5933' },
      'Black': { color: '#090909', opacity: 0.9, highlightColor: '#303030' },
      'Olive': { color: '#1f241a', opacity: 0.88, highlightColor: '#4f5a43' }
    },
    price_addon: 1200, // $12.00
    lead_time_days: 2,
    returnable: false,
    notice: 'Debossing presses the characters into full-grain leather. Texture depth adjusts to grain structure.'
  },

  // 2. Titanium Ballpoint Pen (a-2)
  {
    zone_id: 'zone-pen-laser',
    productId: 'a-2',
    name: 'Upper Barrel Laser Etch',
    image_id: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?q=80&w=1000&auto=format&fit=crop',
    geometry: {
      x: 32.0,
      y: 44.0,
      width: 36.0,
      height: 9.0,
      rotation: -28.0,
      skewX: -2.0,
      skewY: 1.0
    },
    max_lines: 1,
    max_chars_per_line: 16,
    allowed_charset: 'LATIN_BASIC_NUMERIC_PUNCTUATION',
    charset_description: 'Latin characters, numbers, and hyphens.',
    fonts: ENGRAVING_FONTS.filter(f => f.id !== 'architect-script'),
    default_font_id: 'technical-mono',
    supports_monogram: false,
    supports_alignment: true,
    default_alignment: 'center',
    allowed_symbols: CURATED_SYMBOLS.filter(s => s.category !== 'nature'),
    finish_style: 'laser_metal',
    variant_finish_overrides: {
      'Raw Titanium': { color: '#f3f4f6', opacity: 0.72 },
      'Matte Black': { color: '#c9cbcf', opacity: 0.65 },
      'Midnight Blue': { color: '#e2e8f0', opacity: 0.75 }
    },
    price_addon: 1500, // $15.00
    lead_time_days: 2,
    returnable: false,
    notice: 'Fiber laser removes the anodized surface layer, exposing the pale titanium core.'
  },

  // 3. Solid Brass Keychain (a-8)
  {
    zone_id: 'zone-keychain-stamp',
    productId: 'a-8',
    name: 'Face Monogram Zone',
    image_id: 'https://images.unsplash.com/photo-1614312133036-7494a50dbe36?q=80&w=1000&auto=format&fit=crop',
    geometry: {
      x: 36.0,
      y: 40.0,
      width: 28.0,
      height: 20.0,
      rotation: 8.0,
      skewX: 1.5,
      skewY: 1.0
    },
    max_lines: 1,
    max_chars_per_line: 8,
    allowed_charset: 'LATIN_BASIC_NUMERIC_PUNCTUATION',
    charset_description: 'Monograms up to 3 initials or a short word.',
    fonts: ENGRAVING_FONTS,
    default_font_id: 'heritage-slab',
    supports_monogram: true,
    supports_alignment: true,
    default_alignment: 'center',
    allowed_symbols: CURATED_SYMBOLS,
    finish_style: 'laser_metal',
    price_addon: 1000, // $10.00
    lead_time_days: 1,
    returnable: false,
    notice: 'Laser ablation on solid brass. Tone shifts from warm pale gold to subtle amber as patina develops.'
  },

  // 4. Heavyweight Canvas Tote (a-6)
  {
    zone_id: 'zone-tote-embroidery',
    productId: 'a-6',
    name: 'Center Pocket Monogram',
    image_id: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1000&auto=format&fit=crop',
    geometry: {
      x: 38.0,
      y: 52.0,
      width: 24.0,
      height: 12.0,
      rotation: 0,
      skewX: 0,
      skewY: 0
    },
    max_lines: 1,
    max_chars_per_line: 10,
    allowed_charset: 'LATIN_BASIC_NUMERIC_PUNCTUATION',
    charset_description: 'Names or initials up to 10 characters.',
    fonts: ENGRAVING_FONTS.filter(f => f.id !== 'technical-mono'),
    default_font_id: 'classic-serif',
    supports_monogram: true,
    supports_alignment: true,
    default_alignment: 'center',
    allowed_symbols: CURATED_SYMBOLS.slice(0, 4),
    finish_style: 'embroidery',
    price_addon: 1800, // $18.00
    lead_time_days: 3,
    returnable: false,
    notice: 'Direct-to-garment high-density satin stitch embroidery with Japanese polyester thread.'
  },

  // 5. Matte Keyboard 1 (t-1)
  {
    zone_id: 'zone-keyboard-plate',
    productId: 't-1',
    name: 'Bottom Lip Inscription',
    image_id: 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=800&auto=format&fit=crop',
    geometry: {
      x: 62.0,
      y: 78.0,
      width: 25.0,
      height: 8.0,
      rotation: 0,
      skewX: 0,
      skewY: 0
    },
    max_lines: 1,
    max_chars_per_line: 18,
    allowed_charset: 'LATIN_BASIC_NUMERIC_PUNCTUATION',
    charset_description: 'Latin characters, symbols, and tech monograms.',
    fonts: ENGRAVING_FONTS,
    default_font_id: 'technical-mono',
    supports_monogram: false,
    supports_alignment: true,
    default_alignment: 'right',
    allowed_symbols: CURATED_SYMBOLS,
    finish_style: 'laser_metal',
    variant_finish_overrides: {
      'Matte Black': { color: '#e5e7eb', opacity: 0.7 },
      'Graphite': { color: '#f3f4f6', opacity: 0.65 }
    },
    price_addon: 2000, // $20.00
    lead_time_days: 2,
    returnable: false,
    notice: 'Precision laser mark on bead-blasted 6063 aerospace aluminum.'
  }
];
