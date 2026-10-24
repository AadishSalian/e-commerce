/**
 * Personalization & Engraving Data Types
 * Follows the core principle: "What you see is what gets made"
 */

export type EngravingFinishStyle =
  | 'laser_metal'
  | 'debossed_leather'
  | 'engraved_wood'
  | 'foil_emboss'
  | 'embroidery';

export interface CuratedSymbol {
  id: string;
  name: string;
  glyph: string;
  category: 'classic' | 'geometric' | 'nature' | 'monogram';
  svgPath?: string;
}

export interface EngravingFont {
  id: string;
  label: string;
  font_family: string;
  font_file?: string;
  google_font?: string;
  min_size: number; // in percent or relative units
  max_size: number;
  letter_spacing: string;
  is_uppercase_only?: boolean;
  sample_text?: string;
  description?: string;
}

export interface EngravingZoneGeometry {
  x: number; // % from left of image container (0-100)
  y: number; // % from top of image container (0-100)
  width: number; // % width of image container (0-100)
  height: number; // % height of image container (0-100)
  rotation: number; // degrees (-45 to 45)
  skewX?: number; // degrees for perspective compensation
  skewY?: number; // degrees
  perspective?: number; // px for 3D tilt
}

export interface EngravingFinishAppearance {
  color: string;
  shadowColor?: string;
  highlightColor?: string;
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light';
  opacity: number;
  embossDepthPx?: number;
  faintInnerShadow?: boolean;
}

export interface EngravingZone {
  zone_id: string;
  productId: string;
  name: string;
  image_id: string; // The base product image URL the zone lives on
  variant_ids?: string[]; // If specified, zone only shows on these variant IDs
  geometry: EngravingZoneGeometry;
  
  // Limits & Glyph rules
  max_lines: number;
  max_chars_per_line: number;
  allowed_charset: string;
  charset_description: string;
  
  // Available styles
  fonts: EngravingFont[];
  default_font_id: string;
  
  // Layout features
  supports_monogram: boolean;
  supports_alignment: boolean;
  default_alignment: 'left' | 'center' | 'right';
  allowed_symbols?: CuratedSymbol[];
  
  // Finish & Pricing
  finish_style: EngravingFinishStyle;
  variant_finish_overrides?: Record<string, {
    color?: string;
    opacity?: number;
    highlightColor?: string;
  }>;
  price_addon: number; // Minor units (e.g. 1500 = $15.00)
  lead_time_days: number; // Additional business days required
  returnable: boolean; // Almost always false for personalized items
  
  // Honest notice & caveats
  notice?: string;
}

export type MonogramLayout = 'single' | 'stacked' | 'traditional';

export interface PersonalizationValue {
  lines: string[];
  font_id: string;
  alignment: 'left' | 'center' | 'right';
  icon_id?: string;
  icon_position?: 'before' | 'after';
  monogram_mode?: MonogramLayout;
  foil_color?: string;
  zone_id: string;
  variant_id?: string;
}

export interface PersonalizationCartProperty {
  isPersonalized: boolean;
  lines: string[];
  formattedText: string;
  font_id: string;
  font_label: string;
  alignment: 'left' | 'center' | 'right';
  icon_id?: string;
  icon_glyph?: string;
  icon_position?: 'before' | 'after';
  monogram_mode?: MonogramLayout;
  foil_color?: string;
  zone_id: string;
  zone_name: string;
  variant_id?: string;
  finish_style: EngravingFinishStyle;
  price_addon: number; // In cents / minor units
  price_addon_dollars: number; // E.g. 15.00
  lead_time_days: number;
  returnable: boolean;
  previewThumbnailSvg?: string;
  confirmedAt?: string;
  spelledOutText?: string;
  inspectionMono?: string;
}

export interface ValidationIssue {
  field: 'lines' | 'charset' | 'length' | 'moderation' | 'fit';
  lineIndex?: number;
  message: string;
  severity: 'error' | 'warning';
  blockedChar?: string;
}

export interface ValidationResult {
  isValid: boolean;
  sanitizedLines: string[];
  issues: ValidationIssue[];
}

export interface ProductionAssetSpec {
  spec_version: string;
  generated_at: string;
  order_line_reference?: string;
  product_id: string;
  variant_id?: string;
  zone_id: string;
  finish_style: EngravingFinishStyle;
  text_content: {
    raw_lines: string[];
    normalized_nfc: string[];
    monogram_layout?: MonogramLayout;
    icon_glyph?: string;
    icon_position?: 'before' | 'after';
  };
  typography: {
    font_id: string;
    font_family: string;
    computed_font_size_pt: number;
    letter_spacing: string;
    alignment: 'left' | 'center' | 'right';
  };
  physical_geometry_mm: {
    origin_x_mm: number;
    origin_y_mm: number;
    box_width_mm: number;
    box_height_mm: number;
    rotation_deg: number;
    skew_x_deg?: number;
    skew_y_deg?: number;
  };
  production_svg: string;
  operator_notes: string;
}
